import NumberInput from '../../shared/components/NumberInput';
import { ArrowRight, Package, Trash2, ShieldCheck } from 'lucide-react';
import CatalogSelect from '../../shared/components/CatalogSelect';
import MedicationImage from '../../shared/components/MedicationImage';
import ProductSearch from '../../shared/components/ProductSearch';
import { today } from '../../shared/api/domain';
import type { Database, DispatchItem, Destination } from '../../shared/api/domain';
import { dispatchQuantity } from '../../shared/api/dispatchQuantity';
import { buttonClass, inputClass } from '../../shared/styles/formStyles';

export default function DispatchComposer({ db, items, area, note, pending, onItems, onArea, onNote, onSubmit, onClose }: {
  db: Database; items: DispatchItem[]; area: string; note: string; pending: boolean;
  onItems: (items: DispatchItem[]) => void; onArea: (area: string) => void; onNote: (note: string) => void;
  onSubmit: () => Promise<void>; onClose: () => void;
}) {
  const stocks = db.existencias.filter(s => s.ubicacion === 'Farmacia' && s.cantidad > 0 && s.vencimiento && s.vencimiento > today() && db.catalogos.some(p => p.id === s.productoId && p.activo))
    .sort((a,b) => a.vencimiento!.localeCompare(b.vencimiento!));
  const rows = items.map(item => {
    const stock = db.existencias.find(s => s.id === item.stockId);
    const product = db.catalogos.find(p => p.id === stock?.productoId);
    const result = dispatchQuantity(stock?.cantidad || 0, item.cantidad, item.unidadSalida === 'ML', product?.contenidoMl);
    const error = !stocks.some(s => s.id === item.stockId) ? 'Este lote ya no está disponible. Retíralo y selecciona otro.' : result.error;
    return { item, stock, product, result, error, unit: item.unidadSalida === 'ML' ? 'ml (cc)' : product?.unidad || 'unidades' };
  });
  const validArea = db.catalogos.some(c => c.tipo === 'ubicaciones' && c.activo && c.nombre === area);
  const valid = validArea && rows.length > 0 && rows.every(r => !r.error && r.item.destino);
  const totals = new Map<string, number>();
  rows.filter(r => !r.error).forEach(r => totals.set(r.unit, (totals.get(r.unit) || 0) + r.item.cantidad));
  const format = (n: number) => n.toLocaleString('es-NI', { maximumFractionDigits: 3 });
  return <form className="space-y-6" onSubmit={e => { e.preventDefault(); if (valid && !pending) void onSubmit(); }}>
    <fieldset disabled={pending} className="space-y-6 min-w-0">
      <div className="dispatch-intro"><span className="rounded-2xl p-3 bg-white text-blue-600 shadow-sm"><Package size={24} /></span><div><h3 className="font-bold text-[#304a6d]">Envía solo lo que necesitas</h3><p className="text-sm text-slate-500 mt-1">El resto queda disponible en Farmacia. 1 cc = 1 ml.</p></div></div>
      <section className="space-y-3"><h3 className="text-sm font-bold text-[#304a6d]">1. Selecciona la localidad</h3><div className="max-w-xl"><CatalogSelect type="ubicaciones" label="Localidad de destino" value={area} onChange={onArea} required /></div>{area && !validArea && <p role="alert" className="text-sm text-rose-600">Selecciona una localidad activa.</p>}</section>
      <section data-tour-explain="Busca y agrega un medicamento. Al seleccionarlo aparecen cantidad, unidad, saldo y administración por registro. Puedes enviar ml/cc o fracciones según el medicamento; el saldo restante permanece disponible." className="space-y-3"><h3 className="text-sm font-bold text-[#304a6d]">2. Agrega medicamentos y revisa las cantidades</h3><p className="text-xs text-slate-500">Los lotes aparecen por vencimiento más cercano. Puedes buscar por medicamento o lote.</p>
        <ProductSearch options={stocks.filter(s => !items.some(i => i.stockId === s.id)).map(s => { const p = db.catalogos.find(p => p.id === s.productoId)!; return {id:s.id,nombre:p.nombre,codigo:p.codigo,imagen:p.imagen,detalle:`${s.lote} · Vence ${s.vencimiento} · ${format(s.cantidad * (p.contenidoMl || 1))} ${p.contenidoMl ? 'ml (cc)' : p.unidad} disponibles`}; })} onSelect={id => { const stock = stocks.find(s => s.id === id)!; const product = db.catalogos.find(p => p.id === stock.productoId)!; onItems([...items,{stockId:id,cantidad:0,destino:'HOSPITAL',unidadSalida:product.contenidoMl ? 'ML' : 'BASE'}]); }} />
      </section>
      {!rows.length ? <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500"><Package size={32} className="mx-auto mb-3 text-blue-300" /><p>Agrega el primer medicamento para preparar la salida.</p></div> : <table className="dispatch-table w-full text-sm text-left"><caption className="sr-only">Medicamentos seleccionados para enviar</caption><thead><tr>{['Medicamento','Cantidad y unidad','Saldo disponible','Administración',''].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(({item,stock,product,result,error,unit}) => {
        const update = (patch: Partial<DispatchItem>) => onItems(items.map(i => i.stockId === item.stockId ? {...i,...patch} : i));
        return <tr key={item.stockId}>
          <td><div className="flex gap-3 items-start"><MedicationImage src={product?.imagen} name={product?.nombre} /><div><b className="text-[#304a6d]">{product?.nombre || 'Medicamento no disponible'}</b><p className="text-xs text-slate-500 mt-1">Lote {stock?.lote} · Vence {stock?.vencimiento || 'Desconocido'}</p>{product?.contenidoMl ? <p className="text-xs text-blue-600 mt-2">{product.contenidoMl} ml por {product.unidad}</p> : /frasco|ampolla/i.test(product?.unidad || '') && <p className="text-xs text-amber-700 mt-2">Sin contenido en ml configurado. Solicita actualizar el catálogo para enviar cc.</p>}</div></div></td>
          <td><label className="block text-xs text-slate-500">Unidad de salida<select aria-label={'Unidad de ' + product?.nombre} className={inputClass} value={item.unidadSalida || 'BASE'} onChange={e => update({unidadSalida:e.target.value as DispatchItem['unidadSalida'],cantidad:0})}><option value="BASE">{product?.unidad}</option>{!!product?.contenidoMl && <option value="ML">ml (cc)</option>}</select></label><label className="block text-xs text-slate-500 mt-3">Cantidad a enviar<NumberInput aria-label={'Cantidad de ' + product?.nombre} aria-invalid={!!error} aria-describedby={'dispatch-error-' + item.stockId} required type="number" inputMode="decimal" min="0.001" step="0.001" max={result.available} className={inputClass} placeholder="0" value={item.cantidad || ''} onChange={e => update({cantidad:Number(e.target.value)})} /></label>{/tableta/i.test(unit) && <p className="mt-2 text-xs text-slate-500">Admite unidades y fracciones: 0.5 = media tableta.</p>}</td>
          <td><div className="dispatch-balance"><span className="text-xs text-slate-500">Antes de enviar</span><strong>{format(result.available)} {unit}</strong><ArrowRight size={16} className="text-blue-400" /><span className="text-xs text-slate-500">Quedará en Farmacia</span><strong className={error ? 'text-slate-400' : 'text-emerald-700'}>{error ? 'Revisa la cantidad' : `${format(result.remaining)} ${unit}`}</strong></div><p id={'dispatch-error-' + item.stockId} className="text-xs text-rose-600 mt-2" aria-live="polite">{error}</p></td>
          <td><label className="block text-xs text-slate-500">Administración<select aria-label={'Administración de ' + product?.nombre} className={inputClass} value={item.destino} onChange={e => update({destino:e.target.value as Destination})}><option value="HOSPITAL">En la localidad</option><option value="CASA">Para casa</option></select></label></td>
          <td><button type="button" className="p-3 rounded-xl text-rose-500 hover:bg-rose-50" aria-label={'Quitar ' + product?.nombre} onClick={() => onItems(items.filter(i => i.stockId !== item.stockId))}><Trash2 size={18} /></button></td>
        </tr>;
      })}</tbody></table>}
      <label className="block text-sm text-slate-600">Observación (opcional)<textarea className={inputClass} rows={2} maxLength={1000} placeholder="Información adicional sobre esta entrega" value={note} onChange={e => onNote(e.target.value)} /></label>
    </fieldset>
    <div className="rounded-2xl bg-blue-50 p-5 space-y-3"><h3 className="font-bold text-[#304a6d] flex gap-2 items-center"><ShieldCheck size={20} />3. Revisa y confirma</h3><p className="text-sm text-slate-600">{rows.length} registros · {area || 'Localidad pendiente'}</p><div className="flex flex-wrap gap-2">{[...totals].map(([unit,total]) => <span key={unit} className="rounded-lg bg-white px-3 py-2 text-sm text-[#304a6d]">{format(total)} {unit}</span>)}</div><p className="text-xs text-slate-500">Los totales se separan por unidad. Al confirmar se descontará únicamente lo enviado y se guardará el saldo de cada lote.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-4"><button type="button" disabled={pending} onClick={onClose} className="text-sm text-slate-500 py-3">Cerrar y continuar después</button><button disabled={pending || !valid} className={buttonClass}>{pending ? 'Procesando…' : 'Revisar salida'}</button></div>
    <p className="text-xs text-slate-400">El formulario se conserva mientras permanezcas en esta pantalla.</p>
  </form>;
}
