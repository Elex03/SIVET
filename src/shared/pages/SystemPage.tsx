import { usePreference, useTheme } from '../context/preferences';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/Layout/PageHeader';
import DataFeedback from '../components/Layout/DataFeedback';
import { useSivet } from '../api/useSivet';
import { selectDashboard } from '../api/selectors';
import { today } from '../api/domain';
import { useAuth } from '../context/auth';
import { buttonClass, inputClass } from '../styles/formStyles';
export default function SystemPage({ settings = false }: { settings?: boolean }) {
  const state = useSivet();
  const { user } = useAuth(); const [theme, setTheme] = useTheme(); const [mute, setMute] = usePreference(`sivet-mute:${user?.role}:${user?.username}`, 'false');
  const [name, setName] = useState(() => localStorage.getItem('sivet-institution') || 'Hospital Veterinario');
  const [message, setMessage] = useState('');
  const summary = selectDashboard(state.data, '30', today(), today(), 'todas', 'todas');
  const alerts = [...summary.stockBajoData.map(p => ({ id: p.id, text: `${p.medicamento}: stock ${p.stock_actual}, mínimo ${p.minimo}.`, to: '/inventario' })), ...summary.proximosVencerData.map(p => ({ id: p.id, text: `${p.medicamento} · lote ${p.lote}: ${p.dias <= 0 ? 'vencido' : `vence en ${p.dias} días`}.`, to: '/inventario' })), ...state.data.solicitudes.filter(r => r.estado === 'PENDIENTE').map(r => ({ id: r.id, text: `Solicitud pendiente de ${r.area} · ${r.solicitante}.`, to: '/bodega/solicitudes' }))];
  return <div className="screen-page max-w-5xl mx-auto flex flex-col gap-5"><PageHeader header={settings ? 'Configuración' : 'Notificaciones'} sub={settings ? 'Preferencias de este navegador y estado de conexión.' : 'Alertas calculadas a partir del inventario y las solicitudes.'} /><DataFeedback {...state} /><div className="screen-body" tabIndex={0} role="region" aria-label="Contenido de la pantalla">{settings ? <form className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col gap-4" onSubmit={e => { e.preventDefault(); try { localStorage.setItem('sivet-institution', name.trim()); setMessage('Preferencia guardada.'); } catch { setMessage('No se pudo guardar la preferencia.'); } }}><label className="flex gap-3 items-center"><input type="checkbox" checked={mute === "true"} onChange={e => setMute(String(e.target.checked))} />Silenciar avisos emergentes y recordatorios</label><label>Tema de la aplicación<select className={inputClass} value={theme} onChange={e => setTheme(e.target.value)}><option value="light">Claro</option><option value="dark">Oscuro</option></select></label><label>Nombre de institución<input required className={inputClass} value={name} onChange={e => setName(e.target.value)} /></label><p className="text-sm text-slate-500">Usuario: {user?.username} · Rol: {user?.role}</p><p className="text-sm text-slate-500">Conexión: {state.local ? 'Almacenamiento local del navegador' : 'API configurada'}</p><button className={`${buttonClass} self-start`}>Guardar preferencia</button><p role="status">{message}</p></form> : <div className="flex flex-col gap-3">{alerts.length ? alerts.map(a => <Link key={a.id} to={a.to} className="p-5 bg-white rounded-2xl border border-slate-100 text-sm text-[#304a6d] hover:border-blue-300">{a.text} <span className="font-bold">Revisar →</span></Link>) : <p className="bg-white rounded-2xl p-10 text-center text-slate-500">No hay alertas pendientes.</p>}</div>}</div></div>;
}
