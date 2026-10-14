import NumberInput from '../../../shared/components/NumberInput';
import Modal from '../../../shared/components/Layout/Modal';
import LotScanner from '../../../shared/components/LotScanner';
import MedicationImage from '../../../shared/components/MedicationImage';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lightbulb, ScanLine, ArrowLeft, Check, ClipboardCheck, Clock, ExternalLink, PackageCheck, RefreshCw, Save } from 'lucide-react';
import { useSivet } from '../../../shared/api/useSivet';
import { availableStock, today } from '../../../shared/api/domain';
import type { Database, PreparationLine, SupplyRequest } from '../../../shared/api/domain';
import PageHeader from '../../../shared/components/Layout/PageHeader';
import StatCard from '../../../shared/components/Layout/StatCard';
import DataFeedback from '../../../shared/components/Layout/DataFeedback';
import { buttonClass, inputClass } from '../../../shared/styles/formStyles';
import { useConfirmation } from '../../../shared/context/confirmation';

export default function Preparacion({ operational = false }: { operational?: boolean }) {
  const state = useSivet();
  const { local, refresh } = state;
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pendientes');
  const [reload, setReload] = useState(0);
  const [dirty, setDirty] = useState(false);
  const confirm = useConfirmation();
  const choose = async (id: string) => {
    if (id === params.get('pedido')) return;
    if (dirty && !await confirm({ title: '¿Salir del checklist sin guardar?', description: 'El último avance guardado se conserva; los cambios actuales se descartarán.', confirmLabel: 'Descartar cambios', danger: true })) return;
    setDirty(false); setParams(id ? { pedido: id } : {});
  };
  const approved = state.data.solicitudes.filter(r => ['EN PREPARACION', 'LISTO PARA ENTREGA'].includes(r.estado));
  const selected = approved.find(r => r.id === params.get('pedido'));
  const rows = approved.filter(r => (filter === 'todos' || (filter === 'listas' ? r.preparacion?.lista : !r.preparacion?.lista)) && `${r.id} ${r.solicitante} ${r.prioridad}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => Number(b.prioridad === 'URGENTE') - Number(a.prioridad === 'URGENTE') || a.fecha.localeCompare(b.fecha));
  useEffect(() => {
    if (local) return;
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    return () => window.clearInterval(timer);
  }, [local, refresh]);
  return <div className={`screen-page preparation-page ${selected ? 'preparation-editing' : ''}`}>
    <PageHeader header="Preparación de pedidos" sub="Solicitudes aprobadas de Farmacia · Verifica cada medicamento antes de dejarlo listo para enviar." university={operational} />
    <DataFeedback {...state} />
    <div className="grid grid-cols-2 gap-3 shrink-0">
      <button type="button" onClick={() => setFilter('pendientes')} aria-pressed={filter === 'pendientes'} className={`text-left rounded-2xl ${filter === 'pendientes' ? 'ring-2 ring-blue-300' : ''}`}><StatCard title="Por preparar" value={approved.filter(r => !r.preparacion?.lista).length} icon={ClipboardCheck} tone="amber" detail="Aprobados por Bodega" /></button>
      <button type="button" onClick={() => setFilter('listas')} aria-pressed={filter === 'listas'} className={`text-left rounded-2xl ${filter === 'listas' ? 'ring-2 ring-blue-300' : ''}`}><StatCard title="Listos para enviar" value={approved.filter(r => r.preparacion?.lista).length} icon={PackageCheck} tone="emerald" detail="Esperan confirmación de envío" /></button>
    </div>
    <div className="screen-toolbar shrink-0"><div className="filter-controls"><input className={inputClass} aria-label="Buscar pedido para preparar" placeholder="Buscar pedido o solicitante…" value={search} onChange={e => setSearch(e.target.value)} /><select className={inputClass} aria-label="Estado de preparación" value={filter} onChange={e => setFilter(e.target.value)}><option value="pendientes">Por preparar</option><option value="listas">Listos para enviar</option><option value="todos">Todos los aprobados</option></select></div><div className="toolbar-actions"><button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold flex items-center gap-2" onClick={() => void state.refresh()}><RefreshCw size={16} />Actualizar</button>{!operational && <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold flex items-center gap-2" to="/preparacion"><ExternalLink size={16} />Vista operativa</Link>}</div></div>
    <div className="preparation-workspace">
      <section aria-label="Pedidos aprobados para preparar" className={`preparation-list bg-white rounded-2xl border border-slate-200 shadow-sm ${selected ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 shrink-0"><h2 className="font-bold text-[#304a6d]">Pedidos aprobados <span className="text-slate-400 font-normal">({rows.length})</span></h2></div>
        <div className="overflow-y-auto min-h-0 p-3 space-y-3 flex-1">{rows.map(r => { const checked = r.preparacion?.lines.filter(l => l.lista).length || 0; return <button key={r.id} disabled={state.pending} className={`w-full text-left rounded-xl p-4 border transition-colors ${selected?.id === r.id ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200 hover:border-blue-300'}`} onClick={() => void choose(r.id)} aria-pressed={selected?.id === r.id}>
          <div className="flex justify-between gap-2 items-start"><span className="font-semibold text-sm text-[#304a6d] break-all">{r.id}</span><span className={`text-[10px] font-bold rounded-md px-2 py-1 shrink-0 ${r.prioridad === 'URGENTE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{r.prioridad}</span></div>
          <p className="text-xs text-slate-500 mt-2">{r.solicitante} · {new Date(r.fecha).toLocaleDateString('es-NI')}</p>
          <div className="flex items-center gap-2 text-xs mt-3 text-slate-500">{r.preparacion?.lista ? <PackageCheck size={16} className="text-emerald-600" /> : <Clock size={16} className="text-amber-500" />}{r.preparacion?.lista ? 'Listo para enviar' : `${checked}/${(r.approvedItems || r.items).length} medicamentos preparados`}</div>
        </button>; })}{!rows.length && <div className="text-center py-10 px-3 text-sm text-slate-500"><ClipboardCheck className="mx-auto mb-3 text-blue-300" size={32} /><p>No hay pedidos con este filtro.</p><p className="mt-2 text-xs">Los pedidos aparecen cuando Bodega los aprueba.</p></div>}</div>
      </section>
      <section aria-label="Checklist de preparación" className={`preparation-detail bg-white rounded-2xl border border-slate-200 shadow-sm ${selected ? 'flex' : 'hidden lg:flex'}`}>
        {selected ? <PreparationEditor key={`${selected.id}:${reload}`} request={selected} db={state.data} pending={state.pending} onDirty={setDirty} onBack={() => void choose('')} onReload={() => { setDirty(false); setReload(n => n + 1); }} onSave={(lines, version, ready) => state.mutate({ type: 'request.prepare', id: selected.id, lines, version, ready })} /> : <div className="m-auto p-8 text-center"><ClipboardCheck size={42} className="mx-auto text-blue-300 mb-4" /><h2 className="font-bold text-[#304a6d]">Selecciona un pedido</h2><p className="text-sm text-slate-500 mt-2">Su checklist y los lotes disponibles aparecerán aquí.</p></div>}
      </section>
    </div>
  </div>;
}

function PreparationEditor({ request, db, pending, onBack, onReload, onSave, onDirty }: { request: SupplyRequest; db: Database; pending: boolean; onBack: () => void; onReload: () => void; onDirty: (dirty: boolean) => void; onSave: (lines: PreparationLine[], version: number, ready: boolean) => Promise<boolean> }) {
  const approved = request.approvedItems || request.items;
  const [scannerOpen, setScannerOpen] = useState(false);
  const [infoId, setInfoId] = useState<string | null>(null);
  const info = db.catalogos.find(p => p.id === infoId);
  const [version] = useState(request.preparacion?.version || 0);
  const [lines, setLines] = useState<PreparationLine[]>(() => request.preparacion?.lines.map(l => ({ ...l })) || approved.map(i => ({ requestedStockId: i.stockId, stockId: i.stockId, cantidad: 0, lote: db.existencias.find(s => s.id === i.stockId)?.lote || '', vencimiento: db.existencias.find(s => s.id === i.stockId)?.vencimiento || '', comentario: '', lista: false })));
  const [dirty, setDirty] = useState(false);
  const locked = !!request.preparacion?.lista;
  const stale = (request.preparacion?.version || 0) !== version;
  const displayed = locked ? request.preparacion!.lines : lines;
  const completed = displayed.filter(l => l.lista).length;
  const change = (index: number, patch: Partial<PreparationLine>) => { setDirty(true); onDirty(true); setLines(old => old.map((l,i) => i === index ? { ...l, ...patch, lista: patch.lista ?? false } : l)); };
  const scan = (code: string) => {
    const candidates = db.existencias.filter(s => s.ubicacion === 'Bodega Central' && (s.codigoLote === code || s.lote === code));
    const matches = candidates.flatMap(s => displayed.map((line, index) => ({ s, line, index })).filter(({line}) => db.existencias.find(o => o.id === line.requestedStockId)?.productoId === s.productoId));
    if (matches.length !== 1) { toast.error(matches.length ? 'El código coincide con varios registros. Selecciona el lote manualmente.' : 'No se encontró un lote de este pedido asociado al código.'); return; }
    const {s, index} = matches[0];
    if (!s.vencimiento || s.vencimiento <= today() || availableStock(db,s.id,request.id) <= 0) { toast.error('El lote no está disponible para preparar.'); return; }
    change(index,{stockId:s.id,lote:s.lote,vencimiento:s.vencimiento});
    setScannerOpen(false);
    document.getElementById('preparation-line-' + index)?.scrollIntoView({behavior:'smooth',block:'nearest'});
    toast.success('Lote identificado. Verifica fecha y cantidad antes de marcarlo preparado.');
  };
  const save = async (ready: boolean) => { if (await onSave(lines, version, ready)) { setDirty(false); onDirty(false); onReload(); } };
  useEffect(() => { if (!dirty) return; const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener('beforeunload', prevent); return () => window.removeEventListener('beforeunload', prevent); }, [dirty]);
  return <>
    <header className="p-4 sm:p-5 border-b border-slate-100 shrink-0"><div className="flex items-center justify-between gap-3"><button className="text-sm text-blue-600 flex items-center gap-1" onClick={onBack}><ArrowLeft size={16} />Pedidos</button><span className={`rounded-lg px-3 py-1 text-xs font-semibold ${locked ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>{locked ? 'Listo para enviar' : `${completed}/${displayed.length} preparados`}</span></div><h2 className="font-bold text-[#304a6d] mt-3 break-all">{request.id}</h2><p className="text-xs text-slate-500 mt-1">Destino: Farmacia · {request.nota || 'Sin instrucciones adicionales'}</p>{request.preparacion && <p className="text-xs text-slate-400 mt-2">Último guardado: {request.preparacion.usuario} · {new Date(request.preparacion.fecha).toLocaleString('es-NI')}</p>}</header>
    <div className="preparation-steps p-4 sm:p-5 space-y-6">
      <div className="flex items-center gap-4"><progress className="flex-1 h-2 accent-blue-600" aria-label="Medicamentos preparados" value={completed} max={displayed.length || 1} />{!locked && <button type="button" disabled={stale || pending} onClick={() => setScannerOpen(true)} className={buttonClass + ' flex items-center gap-2'}><ScanLine size={18} />Escanear</button>}</div>
      {stale && !locked && <div role="alert" className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">Otra persona actualizó el pedido. <button className="underline font-bold" onClick={onReload}>Cargar cambios guardados</button></div>}
      {displayed.map((line, index) => { const original = db.existencias.find(s => s.id === line.requestedStockId); const stock = db.existencias.find(s => s.id === line.stockId); const product = db.catalogos.find(p => p.id === original?.productoId); const quantity = line.apiCantidadAsignada ?? approved.find(i => i.stockId === line.requestedStockId)?.cantidad ?? 0; const options = db.existencias.filter(s => s.ubicacion === 'Bodega Central' && s.productoId === original?.productoId && s.vencimiento && s.vencimiento > today() && availableStock(db, s.id, request.id) > 0); const matches = !!stock && line.lote.trim() === stock.lote && line.vencimiento === stock.vencimiento && line.vencimiento > today() && line.cantidad === quantity && !!product?.activo && availableStock(db, stock.id, request.id) >= quantity; return <fieldset id={'preparation-line-' + index} key={line.apiAsignacionId || line.requestedStockId} disabled={pending || locked || stale} className={`min-w-0 rounded-2xl shadow-sm bg-white p-5 ${line.lista ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
        <legend className="w-full font-semibold text-sm text-[#304a6d]"><span className="flex items-center justify-between gap-3"><span>{index + 1}. {product?.nombre || 'Medicamento'}</span><button type="button" className="medication-tip" aria-label={'Información de ' + product?.nombre} title="Conoce este medicamento" onClick={() => setInfoId(product?.id || null)}><Lightbulb size={23} /></button></span></legend>
        <div className="flex items-center gap-3 mb-4"><MedicationImage src={product?.imagen} name={product?.nombre} /><p className="flex-1 text-sm text-slate-500">Preparar <b className="text-[#304a6d]">{quantity} {product?.unidad}</b></p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm font-semibold text-slate-600">
          <label className="sm:col-span-2 min-w-0">Lote sugerido · puedes cambiarlo<select className={`${inputClass} mt-1`} value={line.stockId} onChange={e => { const next = options.find(s => s.id === e.target.value); change(index, { stockId: e.target.value, lote: next?.lote || '', vencimiento: next?.vencimiento || '' }); }}>{!options.some(s => s.id === line.stockId) && <option value={line.stockId}>{stock?.lote || 'Lote no disponible'}</option>}{options.map(s => <option key={s.id} value={s.id}>{s.lote} · Vence {s.vencimiento} · Disponibles {availableStock(db, s.id, request.id)}</option>)}</select></label>
          <label>Cantidad preparada<NumberInput className={`${inputClass} mt-1`} type="number" min={0} max={quantity} step={0.001} value={line.cantidad} onChange={e => change(index, { cantidad: Number(e.target.value) })} /></label>
          <label>Lote que aparece en el empaque<input className={`${inputClass} mt-1`} maxLength={100} placeholder="Verifica el empaque" value={line.lote} onChange={e => change(index, { lote: e.target.value })} /></label>
          <label>Vencimiento que aparece en el empaque<input className={`${inputClass} mt-1`} type="date" value={line.vencimiento} onChange={e => change(index, { vencimiento: e.target.value })} /></label>
          <details className="sm:col-span-2"><summary className="cursor-pointer py-2 text-blue-600">Agregar comentario</summary><label className="sr-only" htmlFor={'comment-' + index}>Comentario</label><input id={'comment-' + index} className={`${inputClass} mt-1`} maxLength={1000} value={line.comentario} onChange={e => change(index, { comentario: e.target.value })} placeholder="Observación del medicamento" /></details>
        </div>
        <label className="flex gap-3 items-center mt-5 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-[#304a6d]"><input className="w-5 h-5 accent-blue-600 shrink-0" type="checkbox" checked={line.lista} disabled={!matches || locked || stale || pending} onChange={e => change(index, { lista: e.target.checked })} />Revisado y preparado</label>
        {!matches && !locked && <p className="text-xs text-amber-700 mt-2">Para marcarlo como preparado, la cantidad debe coincidir con la aprobada y los datos del empaque deben coincidir con el lote seleccionado.</p>}
      </fieldset>; })}
    </div>
    <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Escanear medicamento" maxWidth="max-w-xl">{scannerOpen && <LotScanner onScan={scan} />}</Modal>
    <Modal isOpen={!!info} onClose={() => setInfoId(null)} title={info?.nombre || 'Información del medicamento'} maxWidth="max-w-xl"><div className="space-y-5 text-sm text-slate-600"><MedicationImage src={info?.imagen} name={info?.nombre} /><div><h3 className="font-bold text-[#304a6d] mb-2">¿Para qué sirve?</h3><p>{info?.indicaciones || 'Aún no se ha registrado esta información.'}</p></div><div><h3 className="font-bold text-[#304a6d] mb-2">Síntomas que trata</h3><p>{info?.sintomas || 'Aún no se ha registrado esta información.'}</p></div><p>{info?.descripcion}</p><p><b>Acción terapéutica:</b> {info?.accion || 'Sin registrar'}</p></div></Modal>
    <footer className="p-4 border-t border-slate-100 shrink-0">{locked ? <p className="text-sm text-emerald-700 flex gap-2 items-center"><PackageCheck size={20} />Preparación completada. Bodega confirmará el envío a Farmacia.</p> : <><p className="text-xs text-slate-500 mb-3">{dirty ? 'Tienes cambios sin guardar.' : 'El avance se conserva al guardar.'} Puedes guardar y continuar después. Bodega descontará las existencias al confirmar el envío.</p><div className="flex flex-wrap justify-end gap-3"><button disabled={pending || stale} className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50" onClick={() => void save(false)}><Save size={16} />Guardar avance</button><button disabled={pending || stale || completed !== lines.length || !lines.length} className={`${buttonClass} flex items-center gap-2 disabled:opacity-50`} onClick={() => void save(true)}><Check size={17} />Listo para enviar</button></div></>}</footer>
  </>;
}
