const fs = require('node:fs');
const base = { descripcion: '', activo: true, codigo: '', categoria: '', accion: '', marca: '', unidad: '', minimo: 0, correos: [], telefonos: [] };
const catalogos = [
  { id: 'prov-1', tipo: 'proveedores', nombre: 'Distribuidora Veterinaria de Ejemplo', correos: ['ventas@example.com', 'pedidos@example.com'], telefonos: ['+505 0000 0001', '+505 0000 0002'] },
  { id: 'prov-2', tipo: 'proveedores', nombre: 'Laboratorio de Muestra', correos: ['contacto@example.org'], telefonos: ['+505 0000 0003'] },
  ...['Medicamentos', 'Material Médico', 'Biológicos'].map((nombre, i) => ({ id: `cat-${i}`, tipo: 'categorias', nombre })),
  ...['Antibiótico', 'Analgésico', 'Anestésico', 'Vacuna'].map((nombre, i) => ({ id: `ter-${i}`, tipo: 'terapeuticas', nombre })),
  { id: 'marca-1', tipo: 'marcas', nombre: 'Laboratorio Demo' },
  ...[['Amoxicilina 500 mg', 'Medicamentos', 'Antibiótico', 'tabletas', 30], ['Doxiciclina 100 mg', 'Medicamentos', 'Antibiótico', 'tabletas', 20], ['Jeringas 5 ml', 'Material Médico', '', 'unidades', 20], ['Ketamina 50 mg/ml', 'Medicamentos', 'Anestésico', 'frascos', 15], ['Vacuna antirrábica', 'Biológicos', 'Vacuna', 'dosis', 10]].map(([nombre, categoria, accion, unidad, minimo], i) => ({ id: `med-${i+1}`, tipo: 'medicamentos', nombre, codigo: `MED-00${i+1}`, categoria, accion, unidad, minimo, marca: 'Laboratorio Demo' })),
].map(r => ({ ...base, ...r }));
const existencias = [120, 15, 250, 45, 8].map((cantidad, i) => ({ id: `stock-${i+1}`, productoId: `med-${i+1}`, lote: `LOTE-00${i+1}`, vencimiento: i === 4 ? '2026-11-20' : '2028-12-31', cantidad, ubicacion: 'Bodega Central' }));
existencias.push({ ...existencias[0], id: 'farmacia-stock-1', cantidad: 20, ubicacion: 'Farmacia' });
const solicitudes = [
  { id: 'SOL-DEMO-008', area: 'Hospitalización', destino: 'HOSPITAL', estado: 'ENVIADO', entregado: '2026-10-05T14:00:00Z', items: [{ stockId: 'stock-2', cantidad: 5 }] },
  { id: 'SOL-DEMO-001', area: 'Consulta externa', destino: 'CASA', estado: 'PENDIENTE', items: [{ stockId: 'stock-1', cantidad: 10 }] },
  { id: 'SOL-DEMO-002', area: 'Quirófano', destino: 'HOSPITAL', estado: 'EN PREPARACION', items: [{ stockId: 'stock-4', cantidad: 5 }] },
  { id: 'SOL-DEMO-003', area: 'Hospitalización', destino: 'HOSPITAL', estado: 'LISTO PARA ENTREGA', items: [{ stockId: 'stock-3', cantidad: 20 }] },
  { id: 'SOL-DEMO-004', area: 'Consulta externa', destino: 'CASA', estado: 'COMPLETADO', entregado: '2026-10-04T15:00:00Z', items: [{ stockId: 'stock-1', cantidad: 20 }] },
  ...[['Quirófano', 'HOSPITAL', 30], ['Consulta externa', 'CASA', 25], ['Hospitalización', 'HOSPITAL', 15]].map(([area, destino, cantidad], i) => ({ id: `SOL-DEMO-00${i+5}`, area, destino, estado: 'DESPACHADO', entregado: '2026-10-03T14:00:00Z', despachado: '2026-10-03T16:00:00Z', items: [{ stockId: 'stock-3', cantidad }] })),
].map(r => ({ fecha: '2026-10-03T12:00:00Z', solicitante: 'Usuario de muestra', prioridad: 'NORMAL', nota: 'Registro ficticio para demostración.', observacion: '', ...r }));
const recepciones = [{ id: 'REC-DEMO-001', proveedorId: 'prov-1', fecha: '2026-10-01', responsable: 'Usuario de muestra', items: existencias.filter(s => s.ubicacion === 'Bodega Central').map(s => ({ productoId: s.productoId, lote: s.lote, vencimiento: s.vencimiento, cantidad: s.cantidad + (s.productoId === 'med-1' ? 20 : s.productoId === 'med-3' ? 70 : 0) })) }];
const movimientos = recepciones[0].items.map((i, index) => ({ id: `mov-rec-${index}`, fecha: '2026-10-01T12:00:00-06:00', productoId: i.productoId, lote: i.lote, cantidad: i.cantidad, tipo: 'ENTRADA', area: 'Bodega Central', documento: 'REC-DEMO-001' }));
for (const r of solicitudes.filter(r => ['COMPLETADO', 'DESPACHADO'].includes(r.estado))) for (const item of r.items) {
  const stock = existencias.find(s => s.id === item.stockId);
  movimientos.push({ id: `mov-tras-${r.id}`, fecha: r.entregado, productoId: stock.productoId, lote: stock.lote, cantidad: item.cantidad, tipo: 'TRASLADO', area: r.area, destino: r.destino, documento: r.id });
  if (r.estado === 'DESPACHADO') movimientos.push({ id: `mov-sal-${r.id}`, fecha: r.despachado, productoId: stock.productoId, lote: stock.lote, cantidad: item.cantidad, tipo: 'SALIDA', area: r.area, destino: r.destino, documento: r.id });
}
existencias.find(s => s.id === 'stock-2').cantidad -= 5;
existencias.push({ ...existencias.find(s => s.id === 'stock-2'), id: 'transito-SOL-DEMO-008-stock-2', ubicacion: 'En tránsito', cantidad: 5 });
movimientos.push({ id: 'mov-tras-SOL-DEMO-008', fecha: '2026-10-05T14:00:00Z', productoId: 'med-2', lote: 'LOTE-002', cantidad: 5, tipo: 'TRASLADO', area: 'Hospitalización', destino: 'HOSPITAL', documento: 'SOL-DEMO-008' });
const notificaciones = [
  { id: 'not-demo-1', fecha: '2026-10-03T14:00:00Z', rol: 'farmacia', solicitudId: 'SOL-DEMO-002', titulo: 'Solicitud aprobada', mensaje: 'Bodega verificó y reservó las existencias para Quirófano.', leidaPor: [] },
  { id: 'not-demo-2', fecha: '2026-10-05T14:00:00Z', rol: 'farmacia', solicitudId: 'SOL-DEMO-008', titulo: 'Envío pendiente de verificar', mensaje: 'Verifica el lote y las 5 tabletas recibidas antes de confirmar el ingreso.', leidaPor: [] },
];
// Additional sample lots make the eight-row alert previews useful without inventing rows in the UI.
['Meloxicam', 'Cefalexina', 'Metronidazol', 'Solución salina', 'Clorhexidina', 'Enrofloxacina', 'Gasas estériles'].forEach((nombre, i) => {
  const id = `med-extra-${i}`; const cantidad = i + 2;
  catalogos.push({ ...base, id, tipo: 'medicamentos', nombre, codigo: `75000000000${i}`, categoria: i === 6 ? 'Material Médico' : 'Medicamentos', accion: 'Sin clasificación', unidad: 'unidades', minimo: i === 6 ? 0 : 20, marca: 'Laboratorio Demo', presentacion: 'Caja', uxe: 1 });
  existencias.push({ id: `stock-extra-${i}`, productoId: id, lote: `EXP-00${i}`, vencimiento: `2026-11-${String(10 + i).padStart(2,'0')}`, cantidad, ubicacion: 'Bodega Central' });
  recepciones[0].items.push({ productoId: id, lote: `EXP-00${i}`, vencimiento: `2026-11-${String(10 + i).padStart(2,'0')}`, cantidad });
  movimientos.push({ id: `mov-extra-${i}`, fecha: '2026-10-01T12:00:00-06:00', productoId: id, lote: `EXP-00${i}`, cantidad, tipo: 'ENTRADA', area: 'Bodega Central', documento: 'REC-DEMO-001' });
});
recepciones[0].documento = 'FAC-99012'; recepciones[0].estado = 'COMPLETADO';
for (const r of solicitudes) { r.area = 'Farmacia'; delete r.destino; }
for (const m of movimientos.filter(m => m.tipo === 'TRASLADO')) { m.area = 'Farmacia'; delete m.destino; }
const actividad = movimientos.map((m, i) => ({ id: `audit-${i}`, fecha: m.fecha, usuario: 'Operador de ejemplo', localidad: m.tipo === 'SALIDA' ? 'Farmacia' : 'Bodega Central', accion: m.tipo === 'SALIDA' ? 'pharmacy.dispatch' : m.tipo === 'ENTRADA' ? 'receipt.create' : 'request.status', documento: m.documento, detalle: `${m.tipo} · ${catalogos.find(p => p.id === m.productoId)?.nombre} · ${m.cantidad} unidades · ${m.area}` }));
['Consultorio 1','Consultorio 2','Quirófano','Radiografía','Hospitalización','Laboratorio','Consulta externa'].forEach((nombre,i) => catalogos.push({...base,id:'ubicacion-'+i,tipo:'ubicaciones',nombre,descripcion:'Destino de medicamentos de Farmacia'}));
fs.mkdirSync('public/data', { recursive: true });
fs.writeFileSync('public/data/sivet.json', JSON.stringify({ catalogos, existencias, solicitudes, movimientos, recepciones, notificaciones, actividad }, null, 2) + '\n');
