import PageSkeleton from '../components/Layout/PageSkeleton';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { readAccounts, saveAccount, validateAccountChange } from '../api/accounts';
import type { Account, AccountInput } from '../api/accounts';
import type { Role } from '../types/auth';
import { useAuth } from '../context/auth';
import { useConfirmation } from '../context/confirmation';
import PageHeader from '../components/Layout/PageHeader';
import Modal from '../components/Layout/Modal';
import Table from '../components/Table/Table';
import { buttonClass, inputClass } from '../styles/formStyles';
export default function UsersPage() {
  const { user } = useAuth(); const confirm = useConfirmation();
  const [accounts, setAccounts] = useState<Account[]>([]); const [search, setSearch] = useState('');
  const [record, setRecord] = useState<AccountInput | null>(null); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { readAccounts().then(setAccounts).catch(() => toast.error('No se pudieron cargar los usuarios.')).finally(() => setLoading(false)); }, []);
  const save = async () => {
    if (!record || !user || busy) return;
    setBusy(true);
    try {
      if (!editing && accounts.some(a => a.username.toLowerCase() === record.username.toLowerCase())) throw new Error('Este usuario ya existe.');
      validateAccountChange(accounts, record, user.username);
      if (!await confirm({ title: 'Guardar usuario', description: `${record.username} tendrá el rol ${record.role} y quedará ${record.active ? 'activo' : 'inactivo, sin acceso al sistema'}.`, confirmLabel: 'Guardar' })) return;
      await saveAccount(record, user.username); setAccounts(await readAccounts()); setRecord(null); toast.success('Usuario guardado.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'No se pudo guardar.'); } finally { setBusy(false); }
  };
  return <div className="screen-page"><PageHeader header="Administración de usuarios" sub="Gestiona los roles y el acceso al sistema." />{loading && <PageSkeleton />}<div className="screen-body"><div className="screen-toolbar"><button className={`${buttonClass} toolbar-actions`} onClick={() => { setEditing(false); setRecord({ username: '', password: '', role: 'farmacia', active: true }); }}>Crear usuario</button><input className={`${inputClass} toolbar-search`} aria-label="Buscar usuarios" placeholder="Buscar usuario…" value={search} onChange={e => setSearch(e.target.value)} /></div><Table columns={[{ id: 'username', label: 'Usuario' }, { id: 'role', label: 'Rol' }, { id: 'status', label: 'Estado' }]} data={accounts.filter(a => a.username.toLowerCase().includes(search.toLowerCase())).map(a => ({ id: a.username, username: a.username, role: a.role, status: a.active ? 'Activo' : 'Inactivo' }))} onEdit={r => { setEditing(true); setRecord({ username: r.username, role: r.role, active: r.status === 'Activo', password: '' }); }} /></div><Modal isOpen={!!record} onClose={() => !busy && setRecord(null)} title={editing ? 'Editar usuario' : 'Crear usuario'}>{record && <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); void save(); }}><label>Usuario<input required disabled={editing} className={inputClass} value={record.username} onChange={e => setRecord({ ...record, username: e.target.value })} /></label><label>Rol<select className={inputClass} value={record.role} onChange={e => setRecord({ ...record, role: e.target.value as Role })}><option value="preparador">Preparador de Bodega (solo checklist)</option><option value="farmacia">Farmacia</option><option value="bodega">Bodega</option><option value="administrador">Administrador</option></select></label><label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}<input type="password" autoComplete="new-password" required={!editing} minLength={8} className={inputClass} value={record.password} onChange={e => setRecord({ ...record, password: e.target.value })} /></label><label className="flex gap-2"><input type="checkbox" checked={record.active} onChange={e => setRecord({ ...record, active: e.target.checked })} />Usuario activo</label><button disabled={busy} className={buttonClass}>Guardar usuario</button></form>}</Modal></div>;
}
