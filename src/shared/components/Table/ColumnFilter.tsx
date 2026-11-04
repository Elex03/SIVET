import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X } from 'lucide-react';

export default function ColumnFilter({ label, values, selected, onChange }: { label: string; values: string[]; selected?: string[]; onChange: (values?: string[]) => void }) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [search, setSearch] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!position) return;
    const element = panel.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      element.style.left = Math.max(8, Math.min(position.left, window.innerWidth - rect.width - 8)) + 'px';
      element.style.top = Math.max(8, Math.min(position.top, window.innerHeight - rect.height - 8)) + 'px';
      element.querySelector('input')?.focus({ preventScroll: true });
    }
    const outside = (event: PointerEvent) => { if (!element?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setPosition(null); trigger.current?.focus(); } };
    const move = (event: Event) => { if (!(event.target instanceof Node) || !element?.contains(event.target)) setPosition(null); };
    document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', key);
    window.addEventListener('resize', move); window.addEventListener('scroll', move, true);
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', key); window.removeEventListener('resize', move); window.removeEventListener('scroll', move, true); };
  }, [position]);
  const visible = values.filter(value => value.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  const chosen = selected ?? values;
  const update = (next: string[]) => onChange(next.length === values.length ? undefined : next);
  return <>
    <button ref={trigger} type="button" aria-label={`Filtrar ${label}`} aria-expanded={!!position} title={`Filtrar ${label}`} className={`shrink-0 rounded p-1 hover:bg-blue-100 ${selected ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`} onClick={() => { if (position) { setPosition(null); return; } const rect = trigger.current!.getBoundingClientRect(); setSearch(''); setPosition({left:rect.left,top:rect.bottom + 4}); }}><Filter size={13} /></button>
    {position && createPortal(<div ref={panel} role="region" aria-label={`Filtro de ${label}`} className="fixed z-[10000] w-64 max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl text-sm text-slate-700" style={position} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.current) setPosition(null); }}>
      <div className="flex justify-between items-center gap-2 mb-3"><strong className="truncate">{label}</strong><button type="button" aria-label="Cerrar filtro" onClick={() => { setPosition(null); trigger.current?.focus(); }}><X size={16}/></button></div>
      <input aria-label={`Buscar valores de ${label}`} placeholder="Buscar valores…" className="w-full rounded-lg border border-slate-200 p-2 mb-3" value={search} onChange={event => setSearch(event.target.value)} />
      <div className="flex gap-3 text-xs mb-3"><button type="button" className="text-blue-600" onClick={() => onChange(undefined)}>Seleccionar todos</button><button type="button" className="text-slate-500" onClick={() => onChange([])}>Ninguno</button></div>
      <div className="max-h-48 overflow-y-auto space-y-1">{visible.map(value => <label key={value} className="flex items-start gap-2 rounded px-1 py-1.5 hover:bg-slate-50 cursor-pointer"><input type="checkbox" className="mt-1 shrink-0" checked={chosen.includes(value)} onChange={event => update(event.target.checked ? [...chosen, value] : chosen.filter(v => v !== value))}/><span className="break-words min-w-0">{value || '(Vacíos)'}</span></label>)}{!visible.length && <p className="py-3 text-slate-400">Sin coincidencias.</p>}</div>
      <button type="button" className="mt-3 w-full rounded-lg border border-blue-100 py-2 text-blue-600" onClick={() => { onChange(undefined); setPosition(null); }}>Limpiar filtro</button>
    </div>, document.body)}
  </>;
}
