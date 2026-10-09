import { destinations, today } from './domain';
import type { Database } from './domain';
import { selectDashboard } from './selectors';

export function selectReports(db: Database, period: string, from: string, to: string, place: string, category: string) {
  const dashboard = selectDashboard(db, period, from, to, place, category);
  const stock = db.existencias.filter(s => (place === 'todas' || s.ubicacion === place)).map(s => {
    const p = db.catalogos.find(p => p.id === s.productoId);
    return { ...s, vencimiento: s.vencimiento || 'Desconocido', codigo: p?.codigo || '', producto: p?.nombre || '', categoria: p?.categoria || '', unidad: p?.unidad || '', stock: s.cantidad };
  }).filter(s => category === 'todas' || s.categoria === category);
  const end = period === 'custom' ? to : today();
  const startDate = new Date(`${end}T12:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - Number(period === 'custom' ? 0 : period) + 1);
  const start = period === 'custom' ? from : startDate.toISOString().slice(0, 10);
  const activity = (db.actividad || []).filter(a => { const date = new Date(a.fecha).toLocaleDateString('en-CA', { timeZone: 'America/Managua' }); return date >= start && date <= end && (place === 'todas' || a.localidad === place); }).slice().sort((a,b) => b.fecha.localeCompare(a.fecha));
  const activityTotals = new Map<string, number>();
  for (const a of activity) activityTotals.set(a.localidad, (activityTotals.get(a.localidad) || 0) + 1);
  const movements = db.movimientos.map(m => {
    const p = db.catalogos.find(p => p.id === m.productoId);
    return { ...m, fecha: new Date(m.fecha).toLocaleDateString('en-CA', { timeZone: 'America/Managua' }), producto: p?.nombre || '', categoria: p?.categoria, destinoLabel: m.destino ? destinations[m.destino] : 'Ingreso a Bodega' };
  }).filter(m => m.fecha >= start && m.fecha <= end && (category === 'todas' || m.categoria === category) && (place === 'todas' || (place === 'Bodega Central' ? m.tipo !== 'SALIDA' : m.tipo !== 'ENTRADA')));
  const days = new Map<string, { name: string; entradas: number; salidas: number; traslados: number }>();
  for (const m of movements) { const row = days.get(m.fecha) || { name: m.fecha, entradas: 0, salidas: 0, traslados: 0 }; row[m.tipo === 'ENTRADA' ? 'entradas' : m.tipo === 'SALIDA' ? 'salidas' : 'traslados'] += m.cantidad; days.set(m.fecha, row); }
  const totals = new Map<string, { name: string; stock: number }>();
  for (const s of stock) { const row = totals.get(s.productoId) || { name: s.producto, stock: 0 }; row.stock += s.cantidad; totals.set(s.productoId, row); }
  const donations = db.recepciones.filter(r => r.tipoIngreso === 'DONACION' && (!r.estado || r.estado === 'COMPLETADO') && r.fecha >= start && r.fecha <= end && (place === 'todas' || place === 'Bodega Central')).flatMap(r => r.items.map((item, index) => {
    const product = db.catalogos.find(p => p.id === item.productoId);
    return { id: r.id + '-' + index, fecha: r.fecha, documento: r.documento || r.id, donante: r.donante || 'Sin donante', producto: product?.nombre || item.productoId, categoria: product?.categoria || '', unidad: product?.unidad || '', lote: item.lote, vencimiento: item.vencimiento || 'Desconocido', cantidad: item.cantidad, sinFecha: item.vencimiento === null ? item.cantidad : 0, responsable: r.responsable };
  })).filter(r => category === 'todas' || r.categoria === category);
  const donorTotals = new Map<string, { name: string; cantidad: number; sinFecha: number }>();
  for (const d of donations) { const key = d.donante.trim().toLocaleLowerCase('es'); const row = donorTotals.get(key) || { name: d.donante, cantidad: 0, sinFecha: 0 }; row.cantidad += d.cantidad; row.sinFecha += d.sinFecha; donorTotals.set(key, row); }
  const charts = {
    donaciones: [...donorTotals.values()],
    auditoria: [...activityTotals].map(([name, cantidad]) => ({ name, cantidad })),
    existencias: [...totals.values()].sort((a, b) => b.stock - a.stock),
    movimientos: [...days.values()].sort((a, b) => a.name.localeCompare(b.name)),
    bajo_stock: dashboard.stockBajoData.map(p => ({ name: p.medicamento, actual: p.stock_actual, minimo: p.minimo, brecha: p.minimo - p.stock_actual, faltante: p.minimo - p.stock_actual })),
    vencimientos: dashboard.proximosVencerData.map(p => ({ name: `${p.medicamento} (${p.lote})`, dias: p.dias, cantidad: p.cantidad })),
    salidas_area: dashboard.areaData.map(a => ({ ...a, name: a.area })),
  };
  const labels: Record<string,string> = { 'catalog.save':'Catálogo actualizado', 'receipt.create':'Ingreso confirmado', 'receipt.draft':'Borrador guardado', 'receipt.cancel':'Recepción cancelada', 'request.prepare':'Preparación de pedido', 'request.create':'Solicitud enviada', 'request.status':'Estado de solicitud', 'request.receive':'Recepción verificada / incidencia', 'request.review':'Revisión de Bodega', 'pharmacy.dispatch':'Salida a localidad' };
  const tables = {
    donaciones: { columns: [{ id: 'fecha', label: 'Fecha' }, { id: 'documento', label: 'Documento' }, { id: 'donante', label: 'Donante' }, { id: 'producto', label: 'Producto' }, { id: 'lote', label: 'Lote' }, { id: 'vencimiento', label: 'Vencimiento' }, { id: 'cantidad', label: 'Unidades recibidas' }, { id: 'unidad', label: 'Unidad' }, { id: 'responsable', label: 'Responsable' }], data: donations },
    auditoria: { columns: [{ id: 'fecha', label: 'Fecha' }, { id: 'usuario', label: 'Responsable' }, { id: 'localidad', label: 'Localidad' }, { id: 'accion', label: 'Acción' }, { id: 'documento', label: 'Documento' }, { id: 'detalle', label: 'Detalle' }], data: activity.map(a => ({ ...a, accion: labels[a.accion] || a.accion, fecha: new Date(a.fecha).toLocaleString('es-NI') })) },
    existencias: { columns: [{ id: 'codigo', label: 'Código' }, { id: 'producto', label: 'Producto' }, { id: 'lote', label: 'Lote' }, { id: 'ubicacion', label: 'Ubicación' }, { id: 'stock', label: 'Stock' }, { id: 'unidad', label: 'Unidad' }, { id: 'vencimiento', label: 'Vencimiento' }], data: stock },
    movimientos: { columns: [{ id: 'fecha', label: 'Fecha' }, { id: 'tipo', label: 'Movimiento' }, { id: 'producto', label: 'Producto' }, { id: 'cantidad', label: 'Cantidad' }, { id: 'area', label: 'Área' }, { id: 'destinoLabel', label: 'Destino' }], data: movements },
    bajo_stock: { columns: [{ id: 'codigo', label: 'Código' }, { id: 'medicamento', label: 'Producto' }, { id: 'stock_actual', label: 'Stock actual' }, { id: 'minimo', label: 'Mínimo' }], data: dashboard.stockBajoData },
    vencimientos: { columns: [{ id: 'medicamento', label: 'Producto' }, { id: 'lote', label: 'Lote' }, { id: 'vencimiento', label: 'Vencimiento' }, { id: 'dias', label: 'Días restantes' }, { id: 'cantidad', label: 'Cantidad' }], data: dashboard.proximosVencerData },
    salidas_area: { columns: [{ id: 'area', label: 'Área' }, { id: 'hospital', label: 'Hospital' }, { id: 'casa', label: 'Para casa' }, { id: 'total', label: 'Total' }], data: dashboard.areaData.map(a => ({ ...a, id: a.area })) },
  };
  return { charts, tables };
}
