import { useState } from 'react';
import { inventoryAlerts } from '../../shared/api/alerts';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, Inbox, RefreshCw, AlertTriangle } from 'lucide-react';
import PageHeader from '../../shared/components/Layout/PageHeader';
import DataFeedback from '../../shared/components/Layout/DataFeedback';
import { useSivet } from '../../shared/api/useSivet';
import { useAuth } from '../../shared/context/auth';
import { ownsNotification, isUnreadNotification, notificationReader, notificationCategory, groupNotifications } from '../../shared/api/notifications';

export default function NotificationsPage({ bodega = false, combined = false }: { bodega?: boolean; combined?: boolean }) {
  const state = useSivet(); const { user } = useAuth();
  const [origin, setOrigin] = useState('todas');
  const [section, setSection] = useState('Avisos');
  const [category, setCategory] = useState('Todas');
  const [readStatus, setReadStatus] = useState('todos');
  const [audience, setAudience] = useState('propios');
  const [refreshing, setRefreshing] = useState(false);
  if (!user) return null;
  const admin = combined && user.role === 'administrador';
  const roles = admin ? origin === 'todas' ? ['bodega', 'farmacia'] : [origin] : [bodega ? 'bodega' : 'farmacia'];
  const notices = state.data.notificaciones.filter(n => roles.includes(n.rol));
  const unread = notices.filter(n => ownsNotification(n,user) && isUnreadNotification(n,user));
  const visible = notices.filter(n => (audience === 'otras' && admin ? !ownsNotification(n,user) : ownsNotification(n,user)) && (category === 'Todas' || notificationCategory(n) === category) && (readStatus === 'todos' || (readStatus === 'pendientes' ? isUnreadNotification(n,user) : !isUnreadNotification(n,user))));
  const groups = groupNotifications(visible,user);
  const visibleUnread = visible.filter(n => ownsNotification(n,user) && isUnreadNotification(n,user));
  const alerts = roles.flatMap(role => inventoryAlerts(state.data, role === 'bodega' ? 'Bodega Central' : 'Farmacia').map(a => ({...a, role})));
  const alertGroups = [...new Set(alerts.map(a => a.role + ':' + a.title))].map(key => ({key,items:alerts.filter(a => a.role + ':' + a.title === key)}));
  const reader = notificationReader(user);
  const refresh = async () => { if (refreshing) return; setRefreshing(true); try { await state.refresh(); } finally { setRefreshing(false); } };
  const date = (value: string) => new Date(value).toLocaleString('es-NI', {dateStyle:'medium',timeStyle:'short'});
  return <div className="screen-page max-w-5xl mx-auto flex flex-col gap-5 pb-10">
    <PageHeader header="Centro de notificaciones" sub="Primero revisa tus avisos pendientes. Las alertas de inventario se consultan por separado." />
    <DataFeedback {...state} />
    <div className="screen-body notification-center" role="region" aria-label="Notificaciones">
      <div className="notification-toolbar"><div className="flex flex-wrap gap-2" role="group" aria-label="Secciones">
        <button type="button" aria-pressed={section === 'Avisos'} onClick={() => setSection('Avisos')} className={section === 'Avisos' ? 'notification-tab active' : 'notification-tab'}><Bell size={17} />Avisos <span>{unread.length} tuyos sin leer</span></button>
        <button type="button" aria-pressed={section === 'Inventario'} onClick={() => setSection('Inventario')} className={section === 'Inventario' ? 'notification-tab active' : 'notification-tab'}><AlertTriangle size={17} />Inventario <span>{alerts.length} alertas</span></button>
      </div><button type="button" disabled={refreshing || state.pending} onClick={() => void refresh()} className="flex items-center gap-2 text-sm text-[#466e68] disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Actualizando…' : 'Actualizar'}</button></div>
      <div className="notification-filters">
        {admin && <label>Ubicación<select value={origin} onChange={e => setOrigin(e.target.value)}><option value="todas">Bodega y Farmacia</option><option value="bodega">Bodega</option><option value="farmacia">Farmacia</option></select></label>}
        {section === 'Avisos' && <>
          {admin && <label>Destinatario<select value={audience} onChange={e => {setAudience(e.target.value);setReadStatus('todos');}}><option value="propios">Mis avisos</option><option value="otras">Otras cuentas · solo consulta</option></select></label>}
          <label>Tipo<select value={category} onChange={e => setCategory(e.target.value)}>{['Todas','Traslados','Solicitudes','Incidencias'].map(c => <option key={c}>{c}</option>)}</select></label>
          {audience !== 'otras' && <label>Lectura<select value={readStatus} onChange={e => setReadStatus(e.target.value)}><option value="todos">Todos mis avisos</option><option value="pendientes">Sin leer</option><option value="leidos">Leídos</option></select></label>}
          {audience !== 'otras' && <button type="button" disabled={state.pending || !visibleUnread.length} onClick={() => void state.mutate({type:'notification.readAll',ids:visibleUnread.map(n=>n.id),user:reader})} className="ml-auto flex items-center gap-2 text-sm font-semibold text-[#466e68] disabled:opacity-40"><CheckCheck size={18} />{state.pending ? 'Marcando…' : 'Marcar visibles como leídos (' + visibleUnread.length + ')'}</button>}
        </>}
      </div>
      {section === 'Avisos' ? <>
        <div className="text-xs text-slate-500"><p>{visible.length} avisos en {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} · Los grupos con avisos sin leer aparecen primero.</p><p className="mt-1">Agrupados por solicitud. Sin una referencia, se agrupan por evento y día. Abre un grupo para ver su historial.{audience === 'otras' ? ' Esta vista es de consulta; no cambia la lectura de otras cuentas.' : ' La lectura solo afecta tus avisos visibles con estos filtros.'}</p></div>
        <div className="notification-groups">{groups.map(group => <details className="notification-group" key={group.id}>
          <summary><span className={group.unread ? 'notification-icon unread' : 'notification-icon'}><Bell size={18} /></span><span className="min-w-0 flex-1"><span className="block font-semibold text-sm text-[#304a6d] break-words">{group.title}</span><span className="block text-xs text-slate-500 mt-1">{group.role === 'bodega' ? 'Bodega' : 'Farmacia'} · {group.category} · {group.notices.length} {group.notices.length === 1 ? 'aviso' : 'avisos'}</span></span><span className="notification-group-meta"><time dateTime={group.latest}>{date(group.latest)}</time>{group.unread > 0 ? <strong>{group.unread} sin leer</strong> : audience !== 'otras' ? <span>Leídos</span> : <span>Solo consulta</span>}</span><ChevronDown size={17} className="notification-chevron shrink-0" /></summary>
          <div className="notification-events">{group.notices.map(n => {const pending=ownsNotification(n,user) && isUnreadNotification(n,user);return <article key={n.id} className="notification-event"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-sm text-[#304a6d]">{n.titulo}</h3><time dateTime={n.fecha} className="text-xs text-slate-500">{date(n.fecha)}</time></div>{n.mensaje.trim() && n.mensaje.trim() !== n.titulo.trim() && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap break-words">{n.mensaje}</p>}<div className="flex flex-wrap items-center gap-4 mt-2 text-xs"><span className={pending ? 'font-semibold text-[#466e68]' : 'text-slate-500'}>{pending ? 'Sin leer' : ownsNotification(n,user) ? 'Leído' : 'Otra cuenta'}</span>{n.solicitudId && <Link className="font-semibold text-[#355b7c]" to={'/' + n.rol + '/solicitudes?solicitud=' + encodeURIComponent(n.solicitudId)} onClick={() => {if(pending) void state.mutate({type:'notification.read',id:n.id,user:reader});}}>Ver solicitud →</Link>}{pending && <button type="button" disabled={state.pending} className="underline disabled:opacity-50" onClick={() => void state.mutate({type:'notification.read',id:n.id,user:reader})}>Marcar como leído</button>}</div></article>;})}</div>
        </details>)}</div>
        {!groups.length && <div className="notification-empty"><Inbox size={28} /><h2>No hay avisos con estos filtros</h2><p>{audience === 'otras' ? 'No hay avisos de otras cuentas en esta ubicación.' : 'Puedes consultar los leídos o cambiar el tipo y la ubicación.'}</p></div>}
      </> : <>
        <p className="text-sm text-slate-600">Agrupadas por condición y ubicación. No se marcan como leídas: desaparecen al resolver su causa en el inventario.</p>
        <div className="notification-groups">{alertGroups.map(({key,items}) => <details key={key} className="notification-group"><summary><span className="notification-icon alert"><AlertTriangle size={18} /></span><span className="flex-1 min-w-0"><span className="block font-semibold text-sm">{items[0].title}</span><span className="text-xs text-slate-500">{items[0].role === 'bodega' ? 'Bodega' : 'Farmacia'} · {items.length} registros</span></span><ChevronDown size={17} className="notification-chevron" /></summary><div className="notification-events"><Link className="block text-sm font-semibold text-[#355b7c] mb-3" to={items[0].role === 'bodega' ? '/bodega/estanteria' : '/farmacia/inventario'}>Revisar inventario →</Link>{items.map(a => <p key={a.id} className="notification-event text-sm text-slate-600">{a.message}</p>)}</div></details>)}</div>
        {!alerts.length && <div className="notification-empty"><CheckCheck size={28} /><h2>Sin alertas de inventario</h2><p>No hay condiciones pendientes para la ubicación seleccionada.</p></div>}
      </>}
    </div>
  </div>;
}
