import type { Database } from './domain';
import { today } from './domain';
export function inventoryAlerts(db: Database, place: string) {
  const stocks = db.existencias.filter(s => s.ubicacion === place);
  const low = db.catalogos.filter(p => p.tipo === 'medicamentos' && p.activo).flatMap(p => {
    const amount = stocks.filter(s => s.productoId === p.id && s.vencimiento > today()).reduce((n,s) => n+s.cantidad,0);
    return amount < p.minimo ? [{ id: `low-${place}-${p.id}`, title: 'Stock bajo', message: `${p.nombre}: ${amount} ${p.unidad} disponibles; mínimo ${p.minimo}.` }] : [];
  });
  const expiring = stocks.filter(s => s.cantidad > 0 && (Date.parse(s.vencimiento) - Date.parse(today())) / 86400000 <= 90).map(s => ({ id: `expiry-${s.id}`, title: s.vencimiento <= today() ? 'Lote vencido' : 'Próximo vencimiento', message: `${db.catalogos.find(p => p.id === s.productoId)?.nombre} · Lote ${s.lote} · ${s.vencimiento}` }));
  return [...low, ...expiring];
}
