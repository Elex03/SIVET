import { apiErrorMessage } from './apiErrors';
import { NotificationReadError, ownsNotification, notificationReader } from './notifications';
import {
  assertCatalogPermission,
  assertPreparationPermission,
} from "./permissions";
import { readAccounts } from "./accounts";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { apiClient, apiUrl } from "./client";
import { loadServerDatabase, loadServerNotifications, executeServerCommand } from "./server";
import { applyCommand, emptyDatabase } from "./domain";
import type { Command, Database } from "./domain";
import { toast } from "react-toastify";
import { useConfirmation } from "../context/confirmation";
import { useAuth } from "../context/auth";
import { commandConfirmation, commandSuccess } from "./commandFeedback";
import { apiStatus, apiCancelled, getApiPause } from './apiControl';
import { ReceiptConflictError } from './receiptSave';
import type { Receipt } from './domain';

const key = "sivet-data-v1";
let snapshot: Database = emptyDatabase;
let ready = false;
let loadError = "";
let loading: Promise<boolean> | undefined;
let sessionGeneration = 0;
let notificationRevision = 0;
let pollingNotifications = false;
let activeMutations = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
function parseDatabase(value: unknown): Database {
  const raw = value as Database;
  const data = raw && { ...raw, notificaciones: raw.notificaciones || [] };
  if (
    !data ||
    !Object.keys(emptyDatabase).every((k) =>
      Array.isArray(data[k as keyof Database]),
    )
  )
    throw new Error("Los datos recibidos no tienen el formato esperado.");
  return data;
}
async function refresh() {
  if (loading) return loading;
  const generation = sessionGeneration;
  loading = (async () => {
    try {
      const persisted = !apiUrl ? localStorage.getItem(key) : null;
      const saved = apiUrl
        ? await loadServerDatabase()
        : persisted
          ? JSON.parse(persisted)
          : (await apiClient.get<Database>("data/sivet.json")).data;
      if (generation !== sessionGeneration) return false;
      snapshot = parseDatabase(saved);
      loadError = "";
      ready = true;
      return true;
    } catch (error) {
      if (generation === sessionGeneration) {
        loadError =
          apiErrorMessage(error);
        toast.error(loadError, { toastId: "sivet-load-error" });
      }
      return false;
    } finally {
      if (generation === sessionGeneration) loading = undefined;
      emit();
    }
  })();
  const success = await loading;
  // Local reads complete synchronously inside the async body.
  if (generation === sessionGeneration) loading = undefined;
  return success;
}
window.addEventListener("sivet-session", () => {
  sessionGeneration++;
  loading = undefined;
  snapshot = structuredClone(emptyDatabase);
  ready = false;
  loadError = "";
  emit();
  if (apiUrl) void refresh();
});
window.addEventListener("storage", (event) => {
  if (event.key === key && !apiUrl) void refresh();
});
export function useSivet() {
  const confirm = useConfirmation();
  const { user } = useAuth();
  const data = useSyncExternalStore(subscribe, () => snapshot);
  const [, render] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [receiptConflict, setReceiptConflict] = useState<Receipt | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    const unsubscribe = subscribe(() => render((n) => n + 1));
    if (!ready) void refresh();
    return unsubscribe;
  }, []);
  const refreshNotifications = useCallback(async () => {
    if (!apiUrl || !user || loading || pollingNotifications || activeMutations > 0 || getApiPause().until > Date.now()) return;
    pollingNotifications = true;
    const revision = notificationRevision;
    const generation = sessionGeneration;
    try { const notices = await loadServerNotifications(user); if (generation === sessionGeneration && revision === notificationRevision) { snapshot = { ...snapshot, notificaciones: notices }; emit(); } }
    catch { /* Background polling retains the last successful inbox. */ }
    finally { pollingNotifications = false; }
  }, [user]);
  const mutate = useCallback(
    async (command: Command) => {
      command = {
        ...command,
        actor: user?.username || "Sistema",
        localidad:
          user?.role === "farmacia"
            ? "Farmacia"
            : user?.role === "bodega" ||
                user?.role === "preparador" ||
                command.type === "request.prepare"
              ? "Bodega Central"
              : "General",
      };
      if (busy.current) return false;
      busy.current = true;
      activeMutations++;
      setPending(true);
      setError("");
      const mutationGeneration = sessionGeneration;
      let notification: ReturnType<typeof toast.loading> | undefined;
      try {
        if (
          !user ||
          (!apiUrl &&
            !(await readAccounts()).some(
              (a) =>
                a.username === user.username &&
                a.active &&
                a.role === user.role,
            ))
        )
          throw new Error("La sesión no está activa. Vuelve a iniciar sesión.");
        if (command.type === 'notification.read' || command.type === 'notification.readAll') {
          notificationRevision++;
          const ids = command.type === 'notification.read' ? [command.id] : command.ids;
          if (command.user !== notificationReader(user) || !ids.every(id => snapshot.notificaciones.some(n => n.id === id && ownsNotification(n, user)))) throw new Error('Solo puedes marcar como leídos los avisos de tu cuenta.');
        }
        assertCatalogPermission(user?.role, command, snapshot);
        assertPreparationPermission(user?.role, command);
        if (!ready || loadError)
          throw new Error("Actualiza los datos antes de guardar.");
        // Validate the local form before asking for confirmation; validate again at commit.
        if (!apiUrl) applyCommand(snapshot, command);
        if (command.type !== "notification.read" && command.type !== "notification.readAll") {
          if (!(await confirm(commandConfirmation(command, snapshot))))
            return false;
          notification = toast.loading("Guardando cambios…");
        }
        if (mutationGeneration !== sessionGeneration) return false;
        if (apiUrl) {
          const savedId = await executeServerCommand(command, snapshot);
          if (mutationGeneration !== sessionGeneration) return false;
          if (savedId && command.type === "catalog.save")
            command.record.id = savedId;
          // A failed reload must not turn a committed save into a failed submission.
          // Forms use this result to close and must not invite duplicate creations.
          try {
            const updated = command.type === "notification.read" || command.type === "notification.readAll" ? applyCommand(snapshot, command) : parseDatabase(await loadServerDatabase());
            if (mutationGeneration !== sessionGeneration) return false;
            snapshot = updated;
            loadError = "";
          } catch {
            if (mutationGeneration !== sessionGeneration) return false;
            loadError = "Los cambios se guardaron, pero no se pudieron actualizar los datos. Actualiza antes de continuar.";
            toast.warning(loadError, { toastId: "sivet-load-error" });
          }
        } else {
          const current = parseDatabase(
            JSON.parse(localStorage.getItem(key) || JSON.stringify(snapshot)),
          );
          const updated = applyCommand(current, command);
          localStorage.setItem(key, JSON.stringify(updated));
          snapshot = updated;
        }
        emit();
        if (notification !== undefined)
          toast.update(notification, {
            render: commandSuccess(command),
            type: "success",
            isLoading: false,
            autoClose: 4500,
            closeButton: true,
          });
        return true;
      } catch (reason) {
        if (reason instanceof NotificationReadError && command.type === 'notification.readAll') { snapshot = applyCommand(snapshot, { ...command, ids: reason.completedIds }); emit(); }
        if (reason instanceof ReceiptConflictError) setReceiptConflict(reason.currentReceipt);
        if (apiUrl && !command.type.startsWith('receipt.') && !command.type.startsWith('notification.') && apiStatus(reason) !== 429 && !apiCancelled(reason)) await refresh();
        const message =
          apiErrorMessage(reason);
        setError(message);
        if (notification !== undefined)
          toast.update(notification, {
            render: message,
            type: "error",
            isLoading: false,
            autoClose: 6000,
            closeButton: true,
          });
        else toast.error(message);
        return false;
      } finally {
        if (mutationGeneration !== sessionGeneration && notification !== undefined) toast.dismiss(notification);
        notificationRevision++;
        activeMutations--;
        busy.current = false;
        setPending(false);
      }
    },
    [confirm, user],
  );
  return {
    data,
    mutate,
    refreshNotifications,
    reopenReceipt: async (id: string) => {
      await refresh();
      if (loadError) throw new Error(loadError);
      const receipt = snapshot.recepciones.find(r => r.id === id);
      if (!receipt) throw new Error('La recepción ya no está disponible. Actualiza el historial.');
      if (receipt.estado !== 'BORRADOR') throw new Error('Esta recepción ya no es un borrador. Revisa su estado actual.');
      return structuredClone(receipt);
    },
    refresh,
    pending,
    receiptConflict,
    clearReceiptConflict: () => setReceiptConflict(null),
    error: error || loadError,
    loading: !ready && !loadError,
    local: !apiUrl,
  };
}
export const useProveedores = () => {
  const state = useSivet();
  return {
    ...state,
    proveedores: state.data.catalogos.filter((c) => c.tipo === "proveedores"),
  };
};
export const useSolicitudes = useSivet;
export const useInventario = useSivet;
export const useDashboard = useSivet;
