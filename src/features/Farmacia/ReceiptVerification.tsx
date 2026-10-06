import { useState } from 'react';
import type { Database, ReceiptCheck, SupplyRequest } from '../../shared/api/domain';
import { buttonClass, inputClass } from '../../shared/styles/formStyles';

export default function ReceiptVerification({ request, db, pending, onVerify }: { request: SupplyRequest; db: Database; pending: boolean; onVerify: (checks: ReceiptCheck[], note: string, mode: 'confirm' | 'report' | 'return') => Promise<void> }) {
  const [checks, setChecks] = useState(() => request.items.map(i => ({ stockId: i.stockId, cantidad: '', lote: '', vencimiento: '', conforme: false })));
  const [note, setNote] = useState('');
  const allMatch = checks.every(c => { const item = request.items.find(i => i.stockId === c.stockId)!; const s = db.existencias.find(s => s.id === c.stockId); return c.cantidad !== '' && Number(c.cantidad) === item.cantidad && c.lote === s?.lote && c.vencimiento === s.vencimiento && c.conforme; });
  const submit = (mode: 'confirm' | 'report' | 'return') => onVerify(checks.map(c => ({ ...c, cantidad: Number(c.cantidad) })), note, mode);
  return <section className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 flex flex-col gap-4">
    <h3 className="font-bold text-[#304a6d]">Verificar recepción física</h3>
    <p className="text-sm text-slate-600">Cuenta los productos recibidos y compara lote y vencimiento. El inventario de Farmacia se acredita al confirmar la conformidad de todas las líneas.</p>
    {request.incidencia?.revision && <p className="text-sm rounded-xl bg-white p-3">Respuesta de Bodega: {request.incidencia.revision}</p>}
    {checks.map((check, index) => {
      const item = request.items.find(i => i.stockId === check.stockId)!;
      const stock = db.existencias.find(s => s.id === item.stockId)!;
      const product = db.catalogos.find(p => p.id === stock.productoId);
      const update = (value: Partial<typeof check>) => setChecks(checks.map((c, i) => i === index ? { ...c, ...value } : c));
      return <fieldset key={check.stockId} className="border border-slate-200 rounded-xl p-4 bg-white grid sm:grid-cols-3 gap-3">
        <legend className="font-bold text-sm text-[#304a6d] px-2">{product?.nombre}</legend>
        <label className="sm:col-span-3 flex gap-3 items-center p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm"><input type="checkbox" checked={check.conforme && check.cantidad === String(item.cantidad) && check.lote === stock.lote && check.vencimiento === stock.vencimiento} onChange={e => update(e.target.checked ? { cantidad: String(item.cantidad), lote: stock.lote, vencimiento: stock.vencimiento, conforme: true } : { conforme: false })} />Verifiqué este medicamento: recibí todo, con lote, vencimiento y estado correctos.</label>
        <p className="sm:col-span-3 text-xs text-slate-500">Enviado: {item.cantidad} {product?.unidad} · Lote {stock.lote} · Vence {stock.vencimiento}</p>
        <label className="text-sm">Cantidad recibida<input className={inputClass} type="number" min={0} step={1} value={check.cantidad} onChange={e => update({ cantidad: e.target.value })} placeholder="Cantidad contada" /></label>
        <label className="text-sm">Lote recibido<input className={inputClass} value={check.lote} onChange={e => update({ lote: e.target.value.trim() })} /></label>
        <label className="text-sm">Vencimiento recibido<input className={inputClass} type="date" value={check.vencimiento} onChange={e => update({ vencimiento: e.target.value })} /></label>
        <label className="sm:col-span-3 flex gap-2 items-center text-sm"><input type="checkbox" checked={check.conforme} onChange={e => update({ conforme: e.target.checked })} />Producto, presentación y estado físico correctos</label>
      </fieldset>;
    })}
    <label className="text-sm">Observación o diferencia encontrada<textarea className={inputClass} value={note} onChange={e => setNote(e.target.value)} placeholder="Describe faltantes, producto distinto o daño…" /></label>
    {!allMatch && <p className="text-xs text-amber-700">Completa la verificación. Si algo no coincide, informa a Bodega; el envío seguirá pendiente.</p>}
    <div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={pending || !allMatch} onClick={() => void submit('confirm')}>Confirmar recepción conforme</button><button className="rounded-xl p-3 border border-amber-300 text-amber-800 text-sm font-bold disabled:opacity-40" disabled={pending || !note.trim()} onClick={() => void submit('report')}>Dejar pendiente e informar a Bodega</button><button className="rounded-xl p-3 border border-rose-200 text-rose-600 text-sm font-bold disabled:opacity-40" disabled={pending || !note.trim()} onClick={() => void submit('return')}>Devolver envío completo</button></div>
  </section>;
}
