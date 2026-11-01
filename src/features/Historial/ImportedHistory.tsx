import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../shared/api/client';
import { useSivet } from '../../shared/api/useSivet';
import { useAuth } from '../../shared/context/auth';
import { canReadHistory, historyDate, historyLocation, historyProduct, loadHistory, loadHistoryDetail, validateHistoryQuery } from '../../shared/api/history';
import type { HistoricalDetail, HistoricalMovement, HistoryPage, HistoryQuery } from '../../shared/api/history';
import PageHeader from '../../shared/components/Layout/PageHeader';
import Modal from '../../shared/components/Layout/Modal';
import Table from '../../shared/components/Table/Table';
import MedicationUses from '../../shared/components/MedicationUses';
import { buttonClass, inputClass } from '../../shared/styles/formStyles';

const initialQuery: HistoryQuery = { page: 1, limit: 20 };
const documented = (value: unknown): string => value == null || value === '' ? 'No documentado' : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

function Evidence({ title, values }: { title: string; values: Record<string, unknown> | null }) {
  return <section><h3 className="font-bold text-[#304a6d] mb-3">{title}</h3>{values ? <dl className="divide-y divide-slate-100">{Object.entries(values).map(([key, value]) => <div key={key} className="py-2"><dt className="text-xs font-semibold text-slate-500 break-words">{key}</dt><dd><pre className="text-sm font-sans whitespace-pre-wrap break-all">{documented(value)}</pre></dd></div>)}</dl> : <p>No documentado</p>}</section>;
}

function HistoricalRecord({ row }: { row: HistoricalDetail }) {
  const fields: [string, unknown][] = [
    ['Registro', row.id], ['Fecha', historyDate(row.fecha)], ['Tipo', row.tipo], ['Producto identificado', row.medicamento?.nombre],
    ['Producto original', row.producto_original], ['Cantidad documentada', row.cantidad ?? 'Por confirmar'], ['Unidad', row.unidad ?? 'Por confirmar'],
    ['Ubicación de origen', historyLocation(row.ubicacion)], ['Destino documentado', row.destino], ['Lote original', row.lote_original],
    ['Origen del registro', row.origen_registro], ['Estado de revisión', row.estado_revision], ['Motivo de revisión', row.motivo_revision],
    ['Origen del medicamento', row.medicamento?.origen_registro], ['Importación', row.id_importacion],
    ['Archivo', row.fuente.archivo], ['Hoja', row.fuente.hoja], ['Fila', row.fuente.fila], ['Columna', row.fuente.columna], ['SHA-256', row.fuente.sha256],
  ];
  return <div className="space-y-6 text-sm text-slate-600">
    <p className="rounded-xl bg-blue-50 p-4">Importado desde Excel · Solo lectura · No afecta el stock actual.</p>
    <dl className="grid sm:grid-cols-2 gap-4">{fields.map(([label, value]) => <div key={label}><dt className="font-semibold text-slate-500">{label}</dt><dd className="whitespace-pre-wrap break-words mt-1">{documented(value)}</dd></div>)}</dl>
    <MedicationUses value={row.medicamento?.indicaciones} />
    <Evidence title="Datos originales del archivo" values={row.original} />
    <Evidence title="Datos normalizados" values={row.normalizado} />
  </div>;
}

export default function ImportedHistory() {
  const { user } = useAuth();
  const catalog = useSivet();
  const [query, setQuery] = useState<HistoryQuery>(initialQuery);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; page?: HistoryPage; error?: string }>({ key: '' });
  const [selected, setSelected] = useState<number | null>(null);
  const [detailReload, setDetailReload] = useState(0);
  const [detail, setDetail] = useState<{ key: string; row?: HistoricalDetail; error?: string }>({ key: '' });
  const allowed = canReadHistory(user?.role);
  const key = JSON.stringify([query, reload, user?.id, user?.username, user?.role]);
  const detailKey = JSON.stringify([selected, detailReload, user?.id, user?.username, user?.role]);
  const validation = validateHistoryQuery(query);
  const page = result.key === key ? result.page : undefined;
  const error = result.key === key ? result.error : undefined;
  const loading = !!apiUrl && allowed && !validation && result.key !== key;
  const changeFilter = (patch: Partial<HistoryQuery>) => { setQuery(previous => ({ ...previous, ...patch, page: 1 })); setSelected(null); };

  useEffect(() => {
    if (!apiUrl || !allowed || validation) return;
    const controller = new AbortController();
    void loadHistory(query, controller.signal).then(page => {
      if (!controller.signal.aborted) setResult({ key, page });
    }).catch(reason => {
      if (!controller.signal.aborted) setResult({ key, error: reason instanceof Error ? reason.message : 'No se pudo cargar el histórico.' });
    });
    return () => controller.abort();
  }, [key, query, allowed, validation]);

  useEffect(() => {
    if (!apiUrl || !allowed || selected === null) return;
    const controller = new AbortController();
    void loadHistoryDetail(selected, controller.signal).then(row => {
      if (!controller.signal.aborted) setDetail({ key: detailKey, row });
    }).catch(reason => {
      if (!controller.signal.aborted) setDetail({ key: detailKey, error: reason instanceof Error ? reason.message : 'No se pudo cargar el detalle.' });
    });
    return () => controller.abort();
  }, [selected, detailKey, allowed]);

  const rows = (page?.data || []).map(row => ({ ...row,
    fechaLabel: historyDate(row.fecha), productoLabel: historyProduct(row), cantidadLabel: row.cantidad ?? 'Por confirmar',
    unidadLabel: row.unidad ?? 'Por confirmar', ubicacionLabel: historyLocation(row.ubicacion), destinoLabel: row.destino ?? 'No documentado', tipoLabel: row.tipo ?? 'Por confirmar',
  }));
  const totalPages = Math.max(1, Math.ceil((page?.total || 0) / query.limit));
  const inventoryPath = user?.role === 'bodega' ? '/bodega/estanteria' : user?.role === 'farmacia' ? '/farmacia/inventario' : '/inventario';
  return <div className="screen-page max-w-[1600px] mx-auto flex flex-col gap-5">
    <PageHeader header="Histórico importado" sub="Movimientos documentados en los archivos originales. Consulta de evidencia histórica, separada de las operaciones actuales." />
    <div className="screen-body" tabIndex={0} role="region" aria-label="Histórico importado">
      <nav aria-label="Inventario e histórico" className="flex flex-wrap gap-3 text-sm"><Link className="text-blue-600 font-semibold" to={inventoryPath}>Inventario actual</Link>{(user?.role === 'farmacia' || user?.role === 'administrador') && <Link className="text-blue-600 font-semibold" to="/farmacia/salidas">Salidas operativas</Link>}<span aria-current="page" className="font-semibold text-[#304a6d]">Histórico importado</span></nav>
      <p className="rounded-xl bg-blue-50 p-4 text-sm text-slate-600">Importado desde Excel · Solo lectura · No afecta el stock. Se incluyen los registros pendientes y los datos incompletos. Los contadores representan filas documentadas.</p>
      {!allowed ? <p role="alert">Tu perfil no tiene acceso al histórico importado.</p> : !apiUrl ? <p role="alert">El histórico importado requiere conexión con la API. No se usan datos de ejemplo.</p> : <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-100">
          <label className="text-sm">Desde<input type="date" className={inputClass} value={query.desde || ''} onChange={e => changeFilter({ desde: e.target.value || undefined })} /></label>
          <label className="text-sm">Hasta<input type="date" className={inputClass} value={query.hasta || ''} onChange={e => changeFilter({ hasta: e.target.value || undefined })} /></label>
          <label className="text-sm">Medicamento<select className={inputClass} value={query.id_medicamento || ''} onChange={e => changeFilter({ id_medicamento: e.target.value ? Number(e.target.value) : undefined })}><option value="">Todos, incluidos productos por identificar</option>{catalog.data.catalogos.filter(r => r.tipo === 'medicamentos').map(r => <option key={r.id} value={r.id.split(':').at(-1)}>{r.codigo} · {r.nombre}</option>)}</select></label>
          <label className="text-sm">ID de importación<input type="number" min={1} step={1} className={inputClass} value={query.id_importacion ?? ''} placeholder="Todas las importaciones" onChange={e => changeFilter({ id_importacion: e.target.value ? Number(e.target.value) : undefined })} /></label>
          <label className="text-sm">Ubicación<select className={inputClass} value={query.ubicacion || ''} onChange={e => changeFilter({ ubicacion: e.target.value as HistoryQuery['ubicacion'] || undefined })}><option value="">Todas las autorizadas</option><option value="BODEGA">Bodega</option><option value="FARMACIA">Farmacia (incluye traslados entrantes)</option></select></label>
          <label className="text-sm">Tipo<select className={inputClass} value={query.tipo || ''} onChange={e => changeFilter({ tipo: e.target.value as HistoryQuery['tipo'] || undefined })}><option value="">Todos los tipos</option>{['ENTRADA', 'SALIDA', 'TRASLADO'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="text-sm">Estado de revisión<select className={inputClass} value={query.estado_revision || ''} onChange={e => changeFilter({ estado_revision: e.target.value as HistoryQuery['estado_revision'] || undefined })}><option value="">Todos los estados</option><option value="PENDIENTE">Pendiente</option><option value="VALIDADO">Validado</option></select></label>
          <button type="button" className={`${buttonClass} self-end`} onClick={() => { setQuery(initialQuery); setSelected(null); }}>Limpiar filtros</button>
        </div>
        {catalog.error && <p className="text-sm text-amber-700" role="status">No se pudo actualizar el selector de medicamentos: {catalog.error} <button type="button" className="underline" onClick={() => void catalog.refresh()}>Reintentar catálogo</button></p>}
        {validation && <p role="alert" className="text-rose-700">{validation}</p>}
        {loading && <p role="status" className="p-6 bg-white rounded-xl">Cargando página del histórico…</p>}
        {error && <div role="alert" className="rounded-xl p-5 bg-rose-50 text-rose-700"><p>{error}</p><button type="button" className="mt-3 underline font-semibold" onClick={() => setReload(n => n + 1)}>Reintentar</button></div>}
        {page && !validation && <>
          <p role="status" className="text-sm text-slate-600">{page.total.toLocaleString('es-NI')} registros históricos según los filtros y el alcance de tu perfil.</p>
          <Table pagination={false} sortable={false} enableExport={false} columns={[
            { id: 'id', label: 'Registro' }, { id: 'fechaLabel', label: 'Fecha' }, { id: 'tipoLabel', label: 'Tipo' }, { id: 'productoLabel', label: 'Producto' },
            { id: 'cantidadLabel', label: 'Cantidad' }, { id: 'unidadLabel', label: 'Unidad' }, { id: 'ubicacionLabel', label: 'Ubicación de origen' }, { id: 'destinoLabel', label: 'Destino' },
            { id: 'origen_registro', label: 'Origen del registro' }, { id: 'estado_revision', label: 'Estado de revisión', render: (row: HistoricalMovement) => <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.estado_revision === 'PENDIENTE' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{row.estado_revision === 'PENDIENTE' ? 'Pendiente de revisión' : 'Validado'}</span> },
          ]} data={rows} onView={row => setSelected(row.id_fila)} exportTitle="Histórico importado" />
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm bg-white p-4 rounded-xl">
            <label>Filas por página<select className={`${inputClass} ml-2 w-auto`} value={query.limit} onChange={e => changeFilter({ limit: Number(e.target.value) })}>{[20, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
            <span>Página {query.page} de {totalPages} · Orden por ID de fila</span>
            <div className="flex gap-3"><button type="button" disabled={query.page <= 1} className="px-4 py-2 border rounded-xl disabled:opacity-40" onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>Anterior</button><button type="button" disabled={query.page >= totalPages} className="px-4 py-2 border rounded-xl disabled:opacity-40" onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>Siguiente</button></div>
          </div>
        </>}
      </>}
    </div>
    <Modal isOpen={selected !== null} onClose={() => setSelected(null)} title={`Histórico importado · HIST-${selected ?? ''}`}>
      {detail.key !== detailKey ? <p role="status">Cargando detalle…</p> : detail.error ? <div role="alert"><p>{detail.error}</p><button type="button" className="underline mt-3" onClick={() => setDetailReload(n => n + 1)}>Reintentar detalle</button></div> : detail.row && <HistoricalRecord row={detail.row} />}
    </Modal>
  </div>;
}
