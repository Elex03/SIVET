import { LoaderCircle } from 'lucide-react';
import { useApiActivity } from '../../api/apiActivity';
export default function ApiConnectionNotice() {
  const { slow, saving } = useApiActivity();
  if (!slow) return null;
  return <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-md z-[100] flex items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-lg text-[#304a6d]"><LoaderCircle size={22} className="animate-spin shrink-0" /><div><p className="font-semibold text-sm">{saving ? 'Esperando confirmación del guardado' : 'Esperando al servidor'}</p><p className="text-xs text-slate-600 mt-1">{saving ? 'El servidor aún no confirma la operación. Mantén esta pantalla abierta y evita enviarla otra vez.' : 'Está tardando más de lo habitual. Puede estar iniciándose después de un período de inactividad. La consulta continúa.'}</p></div></div>;
}
