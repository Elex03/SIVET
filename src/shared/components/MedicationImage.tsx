import useProtectedAsset from './useProtectedAsset';
import { useState } from 'react';
import Modal from './Layout/Modal';
import { Pill } from 'lucide-react';
export default function MedicationImage({ src, name = 'Medicamento', preview = false }: { src?: string; name?: string; preview?: boolean }) {
  const asset=useProtectedAsset(src);
  const [open, setOpen] = useState(false);
  if (!asset.url) return <span role="img" aria-label="Sin imagen" className="w-12 h-12 rounded-xl bg-blue-50 text-blue-300 flex items-center justify-center shrink-0"><Pill size={22} /></span>;
  const thumbnail = <img src={asset.url} alt={name} className="w-12 h-12 object-contain bg-white border border-slate-100 rounded-xl shrink-0" />;
  if (!preview) return thumbnail;
  return <>
    <button type="button" aria-label={`Ampliar imagen de ${name}`} title="Ampliar imagen" className="block shrink-0 rounded-xl cursor-zoom-in focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2" onClick={event => { event.stopPropagation(); setOpen(true); }}>{thumbnail}</button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title={`Imagen · ${name}`} maxWidth="max-w-4xl">
      <div className="flex justify-center rounded-xl bg-slate-50 p-3"><img src={asset.url} alt={name} className="block max-w-full max-h-[70dvh] object-contain" /></div>
    </Modal>
  </>;
}
