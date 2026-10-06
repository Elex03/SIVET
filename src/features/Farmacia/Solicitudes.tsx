import { useState } from 'react';
import ActivityPanel from '../../shared/components/Layout/ActivityPanel';
import ProductSearch from '../../shared/components/ProductSearch';
import StatCard from '../../shared/components/Layout/StatCard';
import { monthKeys, monthOf } from '../../shared/api/months';
import { Plus, Trash2, ClipboardList, Clock, PackageCheck, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../shared/components/Layout/PageHeader';
import Modal from '../../shared/components/Layout/Modal';
import Table from '../../shared/components/Table/Table';
import DataFeedback from '../../shared/components/Layout/DataFeedback';
import { useSolicitudes } from '../../shared/api/useSivet';
import { useAuth } from '../../shared/context/auth';
import { availableStock, newId, today } from '../../shared/api/domain';
import ReceiptVerification from './ReceiptVerification';
import type { RequestItem, RequestStatus } from '../../shared/api/domain';
import { buttonClass, inputClass } from '../../shared/styles/formStyles';
import { generatePDFTemplate } from '../../shared/utils/printUtils';

export default function Solicitudes({ bodega = false }: { bodega?: boolean }) {
  const state = useSolicitudes();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [params, setParams] = useSearchParams();
  const selected = params.get('solicitud') || '';
  const setSelected = (id: string) => setParams(id ? { solicitud: id } : {});
  const [filter, setFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [note, setNote] = useState('');
  const [observation, setObservation] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);
  const request = state.data.solicitudes.find(r => r.id === selected);
  const stocks = state.data.existencias.filter(s => s.ubicacion === 'Bodega Central' && availableStock(state.data, s.id) > 0 && s.vencimiento > today() && state.data.catalogos.some(p => p.id === s.productoId && p.activo));
  const describe = (stockId: string) => { const s = state.data.existencias.find(s => s.id === stockId); const p = state.data.catalogos.find(p => p.id === s?.productoId); return { producto: p?.nombre || 'Producto', codigo: p?.codigo, unidad: p?.unidad, lote: s?.lote, disponible: availableStock(state.data, stockId, request?.id), stock: s?.cantidad, vencimiento: s?.vencimiento, activo: p?.activo }; };
  const rows = state.data.solicitudes.filter(r => (filter === 'TODOS' || r.estado === filter) && `${r.id} ${r.area} ${r.solicitante} `.toLowerCase().includes(search.toLowerCase())).map(r => ({ ...r, fechaLabel: new Date(r.fecha).toLocaleString('es-NI') }));
  const transition = async (estado: RequestStatus) => { if (request && await state.mutate({ type: 'request.status', id: request.id, estado, observacion: observation })) setSelected(''); };
  const next: Partial<Record<RequestStatus, { estado: RequestStatus; label: string }>> = bodega ? { PENDIENTE: { estado: 'EN PREPARACION', label: 'Aprobar y reservar existencias' }, 'EN PREPARACION': { estado: 'LISTO PARA ENTREGA', label: 'Marcar lista' }, 'LISTO PARA ENTREGA': { estado: 'ENVIADO', label: 'Confirmar envío a Farmacia' } } : {};
  const months = monthKeys();
  const verifiedStock = request?.items.every(i => { const d = describe(i.stockId); return d.disponible >= i.cantidad && d.vencimiento && d.vencimiento > today() && d.activo; });
  return <div className="screen-page max-w-[1600px] mx-auto flex flex-col gap-5 pb-10">
    <PageHeader header={bodega ? 'Solicitudes a Bodega' : 'Farmacia · Solicitudes a Bodega'} sub="Abastecimiento del inventario de Farmacia y verificación de los envíos de Bodega." /><DataFeedback {...state} /><div className="activity-layout"><ActivityPanel db={state.data} location={bodega ? "Bodega Central" : "Farmacia"} /><div className="activity-content" tabIndex={0} role="region" aria-label="Contenido de la pantalla">

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{([{ status: 'TODOS', title: 'Solicitudes del mes', icon: ClipboardList, tone: 'blue', detail: 'Abastecimiento solicitado a Bodega' }, { status: 'PENDIENTE', title: 'Pendientes', icon: Clock, tone: 'amber', detail: 'Esperan aprobación y reserva de existencias' }, { status: 'LISTO PARA ENTREGA', title: 'Listas para entrega', icon: PackageCheck, tone: 'blue', detail: 'Preparadas por Bodega para su envío' }, { status: 'COMPLETADO', title: 'Recibidas (mes)', icon: CheckCircle2, tone: 'emerald', detail: 'Ingresos verificados por Farmacia' }] as const).map(c => { const monthly = c.status === 'TODOS' || c.status === 'COMPLETADO'; const total = (month: string) => state.data.solicitudes.filter(r => (c.status === 'TODOS' || r.estado === c.status) && (!monthly || monthOf(r.recibido || r.fecha) === month)).length; return <button key={c.status} className={`text-left rounded-2xl ${filter === c.status ? 'ring-2 ring-blue-300' : ''}`} onClick={() => setFilter(c.status)}><StatCard title={c.title} icon={c.icon} tone={c.tone} detail={c.detail} value={total(months.current)} previous={monthly ? total(months.previous) : undefined} /></button>; })}</div>
    <div className="flex flex-wrap justify-between items-center gap-3">{!bodega && <div className="flex flex-wrap gap-3"><button onClick={() => { setCreating(true); setItems([]); setNote(''); }} className={buttonClass}><Plus size={16} className="inline mr-2" />Nueva solicitud</button></div>}<div className="flex flex-wrap gap-3 flex-1 justify-end [&>*]:w-auto"><input aria-label="Buscar solicitudes" placeholder="Buscar por solicitud o solicitante…" className={inputClass} value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Estado" className={inputClass} value={filter} onChange={e => setFilter(e.target.value)}>{['TODOS', 'PENDIENTE', 'EN PREPARACION', 'LISTO PARA ENTREGA', 'ENVIADO', 'COMPLETADO', 'DESPACHADO', 'DEVUELTO', 'RECHAZADO'].map(s => <option key={s}>{s}</option>)}</select></div></div>
    <Table columns={[{ id: 'id', label: 'Solicitud' }, { id: 'area', label: 'Área' }, { id: 'solicitante', label: 'Solicitante' }, { id: 'fechaLabel', label: 'Fecha' }, { id: 'estado', label: 'Estado' }]} data={rows} exportTitle="Solicitudes de abastecimiento" onView={row => { setSelected(row.id); setObservation(row.observacion); }} />
    <Modal isOpen={creating} onClose={() => !state.pending && setCreating(false)} title="Nueva solicitud a Bodega">
      <form className="flex flex-col gap-4" onSubmit={async e => { e.preventDefault(); if (await state.mutate({ type: 'request.create', request: { id: `SOL-${newId()}`, fecha: '', solicitante: user?.username || '', area: 'Farmacia', prioridad: priority, estado: 'PENDIENTE', nota: note, observacion: '', items } })) setCreating(false); }}>
        <label>Prioridad<select className={inputClass} value={priority} onChange={e => setPriority(e.target.value)}>{['NORMAL', 'ALTA', 'URGENTE'].map(p => <option key={p}>{p}</option>)}</select></label>

        <ProductSearch options={stocks.filter(s => !items.some(i => i.stockId === s.id)).map(s => ({ id: s.id, nombre: describe(s.id).producto, codigo: describe(s.id).codigo, detalle: s.lote + ' · ' + availableStock(state.data, s.id) + ' disponibles' }))} onSelect={id => setItems([...items, { stockId: id, cantidad: 1 }])} />
        {!stocks.length && <p className="text-sm text-amber-700">No hay lotes disponibles. Registra productos y una recepción en Bodega.</p>}
        {items.map(item => <div key={item.stockId} className="flex flex-wrap items-center gap-3 p-3 border border-slate-200 rounded-xl"><span className="flex-1 text-sm">{describe(item.stockId).producto} · {describe(item.stockId).lote}</span><input aria-label={`Cantidad de ${describe(item.stockId).producto}`} type="number" min={1} max={describe(item.stockId).disponible} step={1} required value={item.cantidad} onChange={e => setItems(items.map(i => i.stockId === item.stockId ? { ...i, cantidad: Number(e.target.value) } : i))} className={`${inputClass} max-w-24`} /><button type="button" title="Quitar producto" onClick={() => setItems(items.filter(i => i.stockId !== item.stockId))}><Trash2 size={18} /></button></div>)}
        <label>Instrucciones de envío (opcional)<textarea className={inputClass} value={note} onChange={e => setNote(e.target.value)} /></label>{state.error && <p role="alert" className="text-rose-600">{state.error}</p>}<button disabled={state.pending || !items.length} className={buttonClass}>{state.pending ? 'Guardando…' : 'Enviar solicitud'}</button>
      </form>
    </Modal>
    <Modal isOpen={!!request} onClose={() => !state.pending && setSelected('')} title="Detalle de solicitud">
      {request && <div className="flex flex-col gap-5"><div className="rounded-xl bg-slate-50 p-4 text-sm space-y-2"><p className="break-all font-mono">{request.id}</p><p><b>{request.area}</b> · {request.solicitante}</p><p>{request.estado} · {request.prioridad}</p><p>{request.nota || 'Sin observaciones de Farmacia.'}</p>{request.despachado && <p>Despachado: {new Date(request.despachado).toLocaleString('es-NI')}</p>}</div>
        <Table enableExport={false} columns={[{ id: 'producto', label: 'Producto' }, { id: 'lote', label: 'Lote' }, { id: 'cantidad', label: 'Cantidad' }, { id: 'unidad', label: 'Unidad' }, ...(bodega ? [{ id: 'stock', label: 'Stock físico' }, { id: 'disponible', label: 'Disponible sin otras reservas' }, { id: 'vencimiento', label: 'Vencimiento' }] : [])]} data={request.items.map(i => ({ ...i, id: i.stockId, ...describe(i.stockId) }))} />
        {bodega && next[request.estado] ? <label>Observación de Bodega<textarea className={inputClass} value={observation} onChange={e => setObservation(e.target.value)} /></label> : <p className="text-sm">{request.observacion}</p>}
        {bodega && next[request.estado] && <p className={verifiedStock ? 'text-sm text-emerald-700' : 'text-sm text-rose-600'}>{verifiedStock ? 'Existencias verificadas: todos los lotes están vigentes y tienen cantidades suficientes, descontando reservas de otras solicitudes.' : 'No se puede aprobar o enviar: hay productos inactivos, vencidos o sin existencias suficientes.'}</p>}
        {request.incidencia && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><h3 className="font-bold">Diferencia de recepción {request.incidencia.resuelta ? 'resuelta' : 'pendiente'}</h3><p>{request.incidencia.nota}</p><p>Reportó: {request.incidencia.receptor}</p>{request.incidencia.checks.map(c => <p key={c.stockId}>{describe(c.stockId).producto}: recibido {c.cantidad}, lote {c.lote || 'sin registrar'}, vencimiento {c.vencimiento || 'sin registrar'}.</p>)}{request.incidencia.revision && <p>Respuesta de Bodega: {request.incidencia.revision}</p>}{bodega && !request.incidencia.resuelta && <><label>Respuesta para Farmacia<textarea className={inputClass} value={observation} onChange={e => setObservation(e.target.value)} placeholder="Describe la revisión o corrección física realizada…" /></label><button className={buttonClass} disabled={state.pending || !observation.trim()} onClick={async () => { if (await state.mutate({ type: 'request.review', id: request.id, note: observation })) setSelected(''); }}>Notificar revisión a Farmacia</button></>}</section>}
        {!bodega && request.estado === 'ENVIADO' && <ReceiptVerification key={request.id} request={request} db={state.data} pending={state.pending} onVerify={async (checks, note, mode) => { if (await state.mutate({ type: 'request.receive', id: request.id, checks, note, receiver: user?.username || '', mode })) setSelected(''); }} />}
        {request.recibido && <p className="text-sm text-emerald-700">Recepción verificada por {request.receptor} · {new Date(request.recibido).toLocaleString('es-NI')}</p>}
        {state.error && <p role="alert" className="text-rose-600">{state.error}</p>}
        <div className="flex flex-wrap gap-3"><button className="text-sm font-bold text-[#304a6d] p-2" onClick={() => generatePDFTemplate({ title: 'Solicitud de medicamentos', subtitle: `${request.area} | ${request.estado}`, columns: ['Código', 'Producto', 'Lote', 'Cantidad', 'Unidad'], data: request.items.map(i => { const d = describe(i.stockId); return [d.codigo || '', d.producto, d.lote || '', i.cantidad, d.unidad || '']; }) })}>Descargar solicitud</button>
          {next[request.estado] && <button disabled={state.pending || (bodega && !verifiedStock)} className={buttonClass} onClick={() => void transition(next[request.estado]!.estado)}>{next[request.estado]!.label}</button>}
          {bodega && next[request.estado] && <button disabled={state.pending || !observation.trim()} className="text-rose-600 border border-rose-200 rounded-xl p-3 disabled:opacity-40" onClick={() => void transition('RECHAZADO')}>Rechazar con motivo</button>}
        </div>
      </div>}
    </Modal>
    
  </div></div></div>;
}
