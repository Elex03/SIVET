import { useState } from 'react';
import Modal from './Layout/Modal';
import { useAuth } from '../context/auth';
import { useSivet } from '../api/useSivet';
import { newId } from '../api/domain';
import { inputClass, buttonClass } from '../styles/formStyles';

export default function CatalogSelect({ type, value, onChange, label, useId = false, required = false, defaults = [] }: { type: string; value: string; onChange: (value: string) => void; label: string; useId?: boolean; required?: boolean; defaults?: string[] }) {
  const state = useSivet(); const { user } = useAuth(); const [adding, setAdding] = useState(false); const [name, setName] = useState('');
  const canAdd = user?.role === 'administrador' || user?.role === 'bodega' || (user?.role === 'farmacia' && type === 'ubicaciones');
  const records = state.data.catalogos.filter(c => c.tipo === type && c.activo);
  const options = records.map(c => ({ value: useId ? c.id : c.nombre, label: c.nombre }));
  for (const item of [...defaults, value]) if (item && !options.some(o => o.value === item)) options.push({ value: item, label: item });
  const create = async () => {
    const record = { id: newId(), tipo: type, nombre: name.trim(), codigo: '', descripcion: '', activo: true, categoria: '', accion: '', marca: '', unidad: '', minimo: 0, correos: [], telefonos: [] };
    if (await state.mutate({ type: 'catalog.save', record })) { onChange(useId ? record.id : record.nombre); setName(''); setAdding(false); }
  };
  return <><label className="block">{label}<select required={required} className={inputClass} value={value} onChange={e => e.target.value === '__add__' ? setAdding(true) : onChange(e.target.value)}><option value="">Seleccionar…</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}{canAdd && <option value="__add__">＋ Agregar registro…</option>}</select></label><Modal isOpen={adding} onClose={() => !state.pending && setAdding(false)} title={'Agregar · ' + label} maxWidth="max-w-lg"><div className="space-y-5"><label className="block text-sm">Nombre<input autoFocus className={inputClass} maxLength={150} value={name} onChange={e => setName(e.target.value)} /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setAdding(false)} className="px-4 py-3 border rounded-xl">Cancelar</button><button type="button" disabled={state.pending || !name.trim()} onClick={() => void create()} className={buttonClass}>Guardar registro</button></div></div></Modal></>;
}
