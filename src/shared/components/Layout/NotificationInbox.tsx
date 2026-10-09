import { usePreference, useTheme } from '../../context/preferences';
import { useEffect, useRef } from 'react';
import { inventoryAlerts } from '../../api/alerts';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSivet } from '../../api/useSivet';
import { useAuth } from '../../context/auth';

export default function NotificationInbox() {
  const state = useSivet();
  const { local, refresh } = state;
  const { user } = useAuth();
  const seen = useRef<Set<string> | null>(null);
  const reader = `${user?.role}:${user?.username}`;
  const [mute] = usePreference(`sivet-mute:${reader}`, 'false'); const muted = mute === 'true'; useTheme();
  const lastReminder = useRef(0);
  const roles = user?.role === 'administrador' ? ['bodega', 'farmacia'] : [user?.role];
  useEffect(() => {
    if (state.loading || !user) return;
    const incoming = state.data.notificaciones.filter(n => user.role === 'administrador' || n.rol === user.role);
    if (seen.current && !muted) incoming.filter(n => !seen.current!.has(n.id) && !n.leidaPor.includes(reader)).forEach(n => toast.info(`${n.titulo}: ${n.mensaje}`, { toastId: n.id }));
    seen.current = new Set(incoming.map(n => n.id));
  }, [state.data.notificaciones, state.loading, user, reader, muted]);
  useEffect(() => {
    if (local) return;
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    return () => window.clearInterval(interval);
  }, [local, refresh]);
  useEffect(() => {
    if (state.loading || muted || !user) return;
    const remind = () => {
      if (document.hidden || Date.now() - lastReminder.current < 300000) return;
      const places = user.role === 'administrador' ? ['Bodega Central', 'Farmacia'] : [user.role === 'farmacia' ? 'Farmacia' : 'Bodega Central'];
      const alerts = places.reduce((n, p) => n + inventoryAlerts(state.data, p).length, 0);
      const pending = state.data.notificaciones.filter(n => (user.role === 'administrador' || n.rol === user.role) && !n.leidaPor.includes(reader)).length;
      if (alerts + pending) { lastReminder.current = Date.now(); toast.warning(`Recordatorio: ${alerts} alertas de inventario y ${pending} avisos sin leer. Revisa tu panel de notificaciones.`, { toastId: 'inventory-reminder', autoClose: 10000 }); }
    };
    remind(); const interval = window.setInterval(remind, 30000);
    return () => window.clearInterval(interval);
  }, [state.data, state.loading, muted, reader, user]);
  const count = roles.reduce((total, role) => total + state.data.notificaciones.filter(n => n.rol === role && !n.leidaPor.includes(reader)).length + inventoryAlerts(state.data, role === 'farmacia' ? 'Farmacia' : 'Bodega Central').length, 0);
  return <div className="flex justify-end px-3 sm:px-5 pt-3"><Link title="Notificaciones" aria-label={`Notificaciones${count ? ': ' + count + ' pendientes' : ''}`} className="relative bg-white border border-slate-200 rounded-xl p-3 text-[#304a6d]" to={user?.role === 'administrador' ? '/notificaciones' : `/${user?.role}/notificaciones`}><Bell size={20} />{count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-4 h-4 px-1 rounded-full text-center">{count > 99 ? '99+' : count}</span>}</Link></div>;
}
