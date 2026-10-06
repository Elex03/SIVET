import type { Database } from './domain';
import { today } from './domain';
export function selectDashboard(db: Database, period: string, from: string, to: string, place: string, category: string) {
  const end = period === 'custom' ? to : today();
  const startDate = new Date(`${end}T12:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - Number(period === 'custom' ? 0 : period) + 1);
  const start = period === 'custom' ? from : startDate.toISOString().slice(0, 10);
  const productMatches = (id: string) => { const p = db.catalogos.find(p => p.id === id); return category === 'todas' || p?.categoria === category; };
  const startTime = Date.parse(start) || Date.parse(today());
  const duration = Math.max(1, Math.round(((Date.parse(end) || startTime) - startTime) / 86400000) + 1);
  const previousEnd = new Date(startTime - 86400000).toISOString().slice(0,10);
  const previousStart = new Date(startTime - duration * 86400000).toISOString().slice(0,10);
  const previousIngresos = db.movimientos.filter(m => { const date = new Date(m.fecha).toLocaleDateString('en-CA', { timeZone: 'America/Managua' }); return m.tipo === 'ENTRADA' && date >= previousStart && date <= previousEnd && productMatches(m.productoId) && place !== 'Farmacia'; }).reduce((n,m) => n+m.cantidad,0);
  const stocks = db.existencias.filter(s => productMatches(s.productoId) && (place === 'todas' || s.ubicacion === place));
  const movements = db.movimientos.filter(m => { const date = new Date(m.fecha).toLocaleDateString('en-CA', { timeZone: 'America/Managua' }); return date >= start && date <= end && productMatches(m.productoId) && (place === 'todas' || (place === 'Bodega Central' ? m.tipo !== 'SALIDA' : m.tipo !== 'ENTRADA')); });
  const categoryMap = new Map<string, { categoria: string; entradas: number; salidas: number }>();
  const areas = new Map<string, { area: string; hospital: number; casa: number; total: number }>();
  const therapy = new Map<string, number>();
  for (const m of movements) {
    const p = db.catalogos.find(p => p.id === m.productoId);
    const label = p?.categoria || 'Sin categoría';
    const value = categoryMap.get(label) || { categoria: label, entradas: 0, salidas: 0 };
    if (m.tipo === 'ENTRADA') value.entradas += m.cantidad;
    if (m.tipo === 'SALIDA') value.salidas += m.cantidad;
    categoryMap.set(label, value);
    if (m.tipo === 'SALIDA') {
      const key = m.area.trim().toLocaleLowerCase('es');
      const a = areas.get(key) || { area: m.area, hospital: 0, casa: 0, total: 0 };
      a.total += m.cantidad;
      if (m.destino === 'CASA') a.casa += m.cantidad; else a.hospital += m.cantidad;
      areas.set(key, a);
    }
  }
  for (const s of stocks) { const label = db.catalogos.find(p => p.id === s.productoId)?.accion || 'Sin clasificación'; therapy.set(label, (therapy.get(label) || 0) + s.cantidad); }
  const low = db.catalogos.filter(p => p.tipo === 'medicamentos' && p.activo && productMatches(p.id)).map(p => ({ id: p.id, codigo: p.codigo, medicamento: p.nombre, minimo: p.minimo, stock_actual: stocks.filter(s => s.productoId === p.id).reduce((n, s) => n + s.cantidad, 0) })).filter(p => p.stock_actual < p.minimo);
  const expiring = stocks.filter(s => s.cantidad > 0).map(s => ({ ...s, medicamento: db.catalogos.find(p => p.id === s.productoId)?.nombre || '', dias: Math.ceil((Date.parse(s.vencimiento) - Date.parse(today())) / 86400000) })).filter(s => s.dias <= 90).sort((a, b) => a.dias - b.dias);
  return { catData: [...categoryMap.values()], terapeuticaData: [...therapy].map(([accion, cantidad]) => ({ accion, cantidad })), areaData: [...areas.values()].sort((a, b) => b.total - a.total), stockBajoData: low, proximosVencerData: expiring, kpis: { previousIngresos, totalSku: db.catalogos.filter(p => p.tipo === 'medicamentos' && p.activo && productMatches(p.id)).length, ingresos: movements.filter(m => m.tipo === 'ENTRADA').reduce((n, m) => n + m.cantidad, 0), alertas: low.length, vencimientos: expiring.length } };
}
