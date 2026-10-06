import { assertCatalogPermission } from './permissions';
import { readAccounts } from './accounts';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { apiClient, apiRequest, apiUrl } from './client';
import { applyCommand, emptyDatabase } from './domain';
import type { Command, Database } from './domain';
import { toast } from 'react-toastify';
import { useConfirmation } from '../context/confirmation';
import { useAuth } from '../context/auth';
import { commandConfirmation, commandSuccess } from './commandFeedback';

const key = 'sivet-data-v1';
let snapshot: Database = emptyDatabase;
let ready = false;
let loadError = '';
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
function parseDatabase(value: unknown): Database {
  const raw = value as Database;
  const data = raw && { ...raw, notificaciones: raw.notificaciones || [] };
  if (!data || !Object.keys(emptyDatabase).every(k => Array.isArray(data[k as keyof Database]))) throw new Error('Los datos recibidos no tienen el formato esperado.');
  return data;
}
async function refresh() {
  if (loading) return loading;
  loading = (async () => {
    try {
      const persisted = !apiUrl ? localStorage.getItem(key) : null;
      const saved = apiUrl ? await apiRequest<Database>('/sivet') : persisted ? JSON.parse(persisted) : (await apiClient.get<Database>('data/sivet.json')).data;
      snapshot = parseDatabase(saved); loadError = ''; ready = true;
    } catch (error) { loadError = error instanceof Error ? error.message : 'No se pudieron cargar los datos.'; toast.error(loadError, { toastId: 'sivet-load-error' }); }
    finally { loading = undefined; emit(); }
  })();
  await loading;
  // Local reads complete synchronously inside the async body.
  loading = undefined;
}
window.addEventListener('storage', event => { if (event.key === key && !apiUrl) void refresh(); });
export function useSivet() {
  const confirm = useConfirmation();
  const { user } = useAuth();
  const data = useSyncExternalStore(subscribe, () => snapshot);
  const [, render] = useState(0);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    const unsubscribe = subscribe(() => render(n => n + 1));
    if (!ready) void refresh();
    return unsubscribe;
  }, []);
  const mutate = useCallback(async (command: Command) => {
    command = { ...command, actor: user?.username || 'Sistema', localidad: user?.role === 'farmacia' ? 'Farmacia' : user?.role === 'bodega' ? 'Bodega Central' : 'General' };
    if (busy.current) return false;
    busy.current = true; setPending(true); setError('');
    let notification: ReturnType<typeof toast.loading> | undefined;
    try {
      if (!user || (!apiUrl && !(await readAccounts()).some(a => a.username === user.username && a.active && a.role === user.role))) throw new Error('La sesión no está activa. Vuelve a iniciar sesión.');
      assertCatalogPermission(user?.role, command, snapshot);
      if (!ready || loadError) throw new Error('Actualiza los datos antes de guardar.');
      // Validate the local form before asking for confirmation; validate again at commit.
      if (!apiUrl) applyCommand(snapshot, command);
      if (command.type !== 'notification.read') {
        if (!await confirm(commandConfirmation(command, snapshot))) return false;
        notification = toast.loading('Guardando cambios…');
      }
      if (apiUrl) {
        snapshot = parseDatabase(await apiRequest<Database>('/sivet/commands', { method: 'POST', body: JSON.stringify(command) }));
      } else {
        const current = parseDatabase(JSON.parse(localStorage.getItem(key) || JSON.stringify(snapshot)));
        const updated = applyCommand(current, command);
        localStorage.setItem(key, JSON.stringify(updated)); snapshot = updated;
      }
      emit(); if (notification !== undefined) toast.update(notification, { render: commandSuccess(command), type: 'success', isLoading: false, autoClose: 4500, closeButton: true }); return true;
    } catch (reason) { const message = reason instanceof Error ? reason.message : 'No se pudo guardar.'; setError(message); if (notification !== undefined) toast.update(notification, { render: message, type: 'error', isLoading: false, autoClose: 6000, closeButton: true }); else toast.error(message); return false; }
    finally { busy.current = false; setPending(false); }
  }, [confirm, user]);
  return { data, mutate, refresh, pending, error: error || loadError, loading: !ready && !loadError, local: !apiUrl };
}
export const useProveedores = () => { const state = useSivet(); return { ...state, proveedores: state.data.catalogos.filter(c => c.tipo === 'proveedores') }; };
export const useSolicitudes = useSivet;
export const useInventario = useSivet;
export const useDashboard = useSivet;
