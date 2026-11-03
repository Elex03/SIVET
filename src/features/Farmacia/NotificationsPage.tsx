import { useState } from 'react';
import { inventoryAlerts } from '../../shared/api/alerts';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, RefreshCw } from 'lucide-react';
import PageHeader from '../../shared/components/Layout/PageHeader';
import DataFeedback from '../../shared/components/Layout/DataFeedback';
import { useSivet } from '../../shared/api/useSivet';
import { useAuth } from '../../shared/context/auth';
import { ownsNotification, isUnreadNotification, notificationReader, notificationCategory } from '../../shared/api/notifications';

export default function NotificationsPage({ bodega = false, combined = false }: { bodega?: boolean; combined?: boolean }) {
  const state = useSivet(); const { user } = useAuth();
  const [origin, setOrigin] = useState('todas');
  const [section, setSection] = useState('Avisos');
  const [category, setCategory] = useState('Todas');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  if (!user) return null;
  const roles = combined && user.role === 'administrador' ? origin === 'todas' ? ['bodega', 'farmacia'] : [origin] : [bodega ? 'bodega' : 'farmacia'];
  const notices = state.data.notificaciones.filter(n => roles.includes(n.rol)).sort((a,b) => b.fecha.localeCompare(a.fecha));
  const unread = notices.filter(n => ownsNotification(n,user) && isUnreadNotification(n,user));
  const visible = notices.filter(n => (!onlyUnread || unread.includes(n)) && (category === 'Todas' || notificationCategory(n) === category));
  const alerts = roles.flatMap(role => inventoryAlerts(state.data, role === 'bodega' ? 'Bodega Central' : 'Farmacia').map(a => ({...a, role})));
  const reader = notificationReader(user);
  const refresh = async () => { if (refreshing) return; setRefreshing(true); try { await state.refresh(); } finally { setRefreshing(false); } };
  return <div className="screen-page max-w-5xl mx-auto flex flex-col gap-5 pb-10">
    <PageHeader header="Centro de notificaciones" sub="Consulta tus avisos y revisa los pendientes de inventario." />
    <DataFeedback {...state} />
    <div className="screen-body space-y-4" role="region" aria-label="Notificaciones">
      <div className="bg-white border border-blue-100 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-lg font-bold text-[#304a6d]">{unread.length} avisos tuyos sin leer</h2><p className="text-sm text-slate-500 mt-1">{alerts.length} alertas de inventario por revisar</p></div>
        <button type="button" disabled={refreshing || state.pending} onClick={() => void refresh()} className="flex items-center gap-2 text-sm text-blue-600 disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Actualizando…' : 'Actualizar'}</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" aria-label="Secciones">{['Avisos','Alertas de inventario'].map(tab => <button type="button" key={tab} aria-pressed={section === tab} onClick={() => setSection(tab)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${section === tab ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{tab}</button>)}</div>
        {combined && <label className="text-sm text-slate-600">Bandeja <select value={origin} onChange={e => setOrigin(e.target.value)} className="rounded-xl border border-slate-200 p-2 bg-white"><option value="todas">Bodega y Farmacia</option><option value="bodega">Bodega</option><option value="farmacia">Farmacia</option></select></label>}
      </div>
      {section === 'Avisos' ? <>
        <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-100 rounded-xl p-4">
          <label className="text-sm text-slate-600">Tipo <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-lg border border-slate-200 p-2">{['Todas','Traslados','Solicitudes','Incidencias'].map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="flex gap-2 items-center text-sm text-slate-600"><input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} />Mis avisos sin leer</label>
          <button type="button" disabled={state.pending || !unread.length} onClick={() => void state.mutate({type:'notification.readAll', ids:unread.map(n=>n.id), user:reader})} className="ml-auto flex items-center gap-2 text-sm font-semibold text-blue-600 disabled:opacity-40"><CheckCheck size={18} />{state.pending ? 'Marcando…' : `Marcar todos como leídos (${unread.length})`}</button>
        </div>
        <p className="text-xs text-slate-500">La lectura se aplica a tus avisos de la bandeja seleccionada. Las alertas de inventario permanecen hasta resolver su causa.</p>
        {visible.map(n => { const own = ownsNotification(n,user); const pending = own && isUnreadNotification(n,user); return <article key={n.id} className={`rounded-2xl border p-5 flex gap-4 ${pending ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-100'}`}>
          <Bell size={20} className="text-[#304a6d] shrink-0 mt-1" /><div className="flex-1 min-w-0"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-[#304a6d]">{n.titulo}</h2><time dateTime={n.fecha} className="text-xs text-slate-500">{new Date(n.fecha).toLocaleString('es-NI')}</time></div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2"><span>{n.rol === 'bodega' ? 'Bodega' : 'Farmacia'} · {notificationCategory(n)}</span><span className={pending ? 'text-blue-600 font-semibold' : ''}>{!own ? 'Otra cuenta · solo consulta' : pending ? 'Sin leer' : 'Leído'}</span></div>
          <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap break-words">{n.mensaje}</p>
          <div className="flex flex-wrap gap-4 mt-4">{n.solicitudId && <Link className="text-sm font-semibold text-blue-600" to={`/${n.rol}/solicitudes?solicitud=${encodeURIComponent(n.solicitudId)}`} onClick={() => { if (pending) void state.mutate({type:'notification.read',id:n.id,user:reader}); }}>Ver solicitud →</Link>}{pending && <button type="button" disabled={state.pending} className="flex items-center gap-2 text-sm text-slate-600 disabled:opacity-50" onClick={() => void state.mutate({type:'notification.read',id:n.id,user:reader})}><CheckCheck size={16} />Marcar como leído</button>}</div></div>
        </article>; })}
        {!visible.length && <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-500"><Inbox className="mx-auto mb-3" /><p>No hay avisos con estos filtros.</p></div>}
      </> : <>
        <p className="text-sm text-slate-600">Estas alertas se actualizan con el inventario y no se marcan como leídas. Puedes silenciar los recordatorios emergentes en Configuración.</p>
        {alerts.map(a => <article key={`${a.role}:${a.id}`} className="border border-amber-200 bg-amber-50/60 p-5 rounded-2xl"><h2 className="font-semibold text-amber-800">{a.title} · {a.role === 'bodega' ? 'Bodega' : 'Farmacia'}</h2><p className="text-sm text-slate-600 mt-2">{a.message}</p><Link className="text-sm font-semibold text-blue-600 mt-3 inline-block" to={a.role === 'bodega' ? '/bodega/estanteria' : '/farmacia/inventario'}>Revisar inventario →</Link></article>)}
        {!alerts.length && <p className="bg-white rounded-2xl p-10 text-center text-slate-500">No hay alertas de inventario pendientes.</p>}
      </>}
    </div>
  </div>;
}
