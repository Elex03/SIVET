import { useAuth } from '../../shared/context/auth';
import { canEditMedication } from '../../shared/api/permissions';
import { Package, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import StatCard from '../../shared/components/Layout/StatCard';
import ActivityPanel from '../../shared/components/Layout/ActivityPanel';
import MedicationForm from '../Catalogos/MedicationForm';
import type { CatalogRecord } from '../../shared/api/domain';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../shared/components/Layout/PageHeader';
import Table from '../../shared/components/Table/Table';
import Modal from '../../shared/components/Layout/Modal';
import DataFeedback from '../../shared/components/Layout/DataFeedback';
import { useInventario } from '../../shared/api/useSivet';
import { destinations, today } from '../../shared/api/domain';
import { buttonClass, inputClass } from '../../shared/styles/formStyles';
export default function InventoryPage({ location = '' }: { location?: string }) {
  const state = useInventario(); const { user } = useAuth();
  const [editing, setEditing] = useState<CatalogRecord | null>(null);
  const [search, setSearch] = useState('');
  const [place, setPlace] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState('');
  const rows = state.data.existencias.map(s => {
    const p = state.data.catalogos.find(p => p.id === s.productoId);
    const days = Math.ceil((Date.parse(s.vencimiento) - Date.parse(today())) / 86400000);
    return { ...s, producto: p?.nombre, codigo: p?.codigo, categoria: p?.categoria, unidad: p?.unidad, minimo: p?.minimo || 0, dias: days,
      estado: days <= 0 ? 'Vencido' : days <= 90 ? 'Por vencer' : s.cantidad === 0 ? 'Sin stock' : s.cantidad < (p?.minimo || 0) ? 'Bajo stock' : 'Disponible' };
  }).filter(s => (!location || s.ubicacion === location) && (!place || s.ubicacion === place));
  const filtered = rows.filter(s => (!status || (status === 'Bajo stock' ? s.cantidad < s.minimo : status === 'Por vencer' ? s.dias > 0 && s.dias <= 90 && s.cantidad > 0 : status === 'Vencido' ? s.dias <= 0 && s.cantidad > 0 : s.estado === status)) && `${s.producto} ${s.codigo} ${s.lote}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="screen-page max-w-[1600px] mx-auto flex flex-col gap-5 pb-10"><PageHeader header={location ? `Inventario · ${location}` : 'Inventario General'} sub="Existencias por lote, ubicación y vencimiento." /><DataFeedback {...state} /><div className="activity-layout"><ActivityPanel db={state.data} location={location} /><div className="activity-content" tabIndex={0} role="region" aria-label="Contenido de la pantalla">

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[{title:'Lotes registrados', value:rows.length, icon:Package, tone:'blue' as const, detail: `${new Set(rows.map(r => r.productoId)).size} medicamentos en las ubicaciones seleccionadas`}, {title:'Stock bajo', value:rows.filter(s => s.cantidad < s.minimo).length, icon:AlertTriangle, tone:'rose' as const, detail:'Lotes por debajo del mínimo configurado'}, {title:'Por vencer', value:rows.filter(s => s.dias > 0 && s.dias <= 90 && s.cantidad > 0).length, icon:Clock, tone:'amber' as const, detail:'Vencen durante los próximos 90 días'}, {title:'Vencidos', value:rows.filter(s => s.dias <= 0 && s.cantidad > 0).length, icon:ShieldAlert, tone:'rose' as const, detail:'No disponibles para salida; requieren revisión'}].map((card, i) => <button type="button" key={card.title} aria-pressed={status === ['', 'Bajo stock', 'Por vencer', 'Vencido'][i]} onClick={() => setStatus(['', 'Bajo stock', 'Por vencer', 'Vencido'][i])} className={`text-left rounded-2xl ${status === ['', 'Bajo stock', 'Por vencer', 'Vencido'][i] ? 'ring-2 ring-blue-400' : ''}`}><StatCard {...card} /></button>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-3">{!location && canEditMedication(user?.role) && <Link to="/catalogos" className={buttonClass}>Catálogo de medicamentos</Link>}{location === 'Bodega Central' && <><Link to="/bodega/pedidos/recepcion" className={buttonClass}>Recibir pedido</Link></>}{location === 'Farmacia' && <Link to="/farmacia/solicitudes" className={buttonClass}>Solicitudes a Bodega</Link>}</div><div className="flex flex-wrap gap-3 flex-1 justify-end [&>*]:w-auto [&>input]:min-w-48"><input aria-label="Buscar inventario" className={inputClass} placeholder="Buscar producto, código o lote…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Estado de inventario" className={inputClass} value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{['Disponible', 'Bajo stock', 'Sin stock', 'Por vencer', 'Vencido'].map(s => <option key={s}>{s}</option>)}</select>{!location && <select aria-label="Ubicación" className={inputClass} value={place} onChange={e => setPlace(e.target.value)}><option value="">Todas las ubicaciones</option><option>Bodega Central</option><option>Farmacia</option><option>En tránsito</option><option>En revisión</option></select>}</div></div>
    <Table columns={[{ id: 'codigo', label: 'Código' }, { id: 'producto', label: 'Producto' }, { id: 'lote', label: 'Lote' }, { id: 'cantidad', label: 'Stock' }, { id: 'unidad', label: 'Unidad' }, { id: 'ubicacion', label: 'Ubicación' }, { id: 'vencimiento', label: 'Vencimiento' }, { id: 'estado', label: 'Estado' }]} data={filtered} onEdit={canEditMedication(user?.role) ? r => setEditing(state.data.catalogos.find(p => p.id === r.productoId) || null) : undefined} onView={r => setSelected(r.id)} exportTitle="Inventario actual" />
    <Modal isOpen={!!selected} onClose={() => setSelected('')} title="Kardex · Historial del lote"><p className="text-sm text-slate-500 mb-4">Entradas, traslados y salidas finales. Los traslados conservan el inventario total.</p><Table columns={[{ id: 'fecha', label: 'Fecha' }, { id: 'tipo', label: 'Movimiento' }, { id: 'cantidad', label: 'Cantidad' }, { id: 'area', label: 'Área' }, { id: 'destinoLabel', label: 'Destino final' }, { id: 'documento', label: 'Documento' }]} data={state.data.movimientos.filter(m => { const stock = rows.find(r => r.id === selected); return stock && stock.productoId === m.productoId && stock.lote === m.lote; }).map(m => ({ ...m, fecha: new Date(m.fecha).toLocaleString('es-NI'), destinoLabel: m.destino ? destinations[m.destino] : 'Ingreso a Bodega' }))} exportTitle="Kardex de producto" /></Modal>
    <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar medicamento">{editing && <MedicationForm key={editing.id} initial={editing} onSave={() => setEditing(null)} onCancel={() => setEditing(null)} />}</Modal>
  </div></div></div>;
}
