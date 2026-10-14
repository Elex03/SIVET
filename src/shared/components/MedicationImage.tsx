import useProtectedAsset from './useProtectedAsset';
import { Pill } from 'lucide-react';
export default function MedicationImage({ src, name = 'Medicamento' }: { src?: string; name?: string }) {
  const asset=useProtectedAsset(src);
  return asset.url ? <img src={asset.url} alt={name} className="w-12 h-12 object-contain bg-white border border-slate-100 rounded-xl shrink-0" /> : <span role="img" aria-label="Sin imagen" className="w-12 h-12 rounded-xl bg-blue-50 text-blue-300 flex items-center justify-center shrink-0"><Pill size={22} /></span>;
}
