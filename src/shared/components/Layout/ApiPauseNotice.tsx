import { useEffect, useState, useSyncExternalStore } from 'react';
import { cancelApiWaits, getApiPause, subscribeApiPause } from '../../api/apiControl';

export default function ApiPauseNotice() {
  const pause = useSyncExternalStore(subscribeApiPause, getApiPause);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!pause.until) return;
    const timer = setInterval(() => { const time = Date.now(); setNow(time); if (time >= pause.until) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [pause.until]);
  const seconds = Math.max(0, Math.ceil((pause.until - now) / 1000));
  if (!seconds && !pause.waiting) return null;
  return <div role="status" className="shrink-0 bg-amber-50 border-b border-amber-200 p-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
    <span>La API limitó las solicitudes. Espera {seconds} s. Tu formulario se conserva; la sesión sigue abierta.</span>
    {pause.waiting > 0 && <button type="button" className="underline font-semibold" onClick={cancelApiWaits}>Cancelar espera</button>}
  </div>;
}
