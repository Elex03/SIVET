const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
// Compile the same pure TypeScript domain used by the browser, without a second implementation.
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(result.outputText, filename);
};
const { applyCommand, availableStock, today } = require('../src/shared/api/domain.ts');
const { selectDashboard } = require('../src/shared/api/selectors.ts');
const { selectReports } = require('../src/shared/api/reports.ts');
const fixtures = require('../public/data/sivet.json');
const { assertCatalogPermission, canEditMedication } = require('../src/shared/api/permissions.ts');
const { authenticateAccount, validateAccountChange } = require('../src/shared/api/accountRules.ts');
const accounts = require('../public/data/users.json');
test('solo bodega y administración editan medicamentos; farmacia solo ubicaciones', () => {
  const source = structuredClone(fixtures); const medicine = source.catalogos.find(c => c.tipo === 'medicamentos');
  assert.equal(canEditMedication('farmacia'), false);
  assert.throws(() => assertCatalogPermission('farmacia', {type:'catalog.save',record:medicine}, source), /permiso/);
  for (const role of ['bodega','administrador']) assert.doesNotThrow(() => assertCatalogPermission(role, {type:'catalog.save',record:medicine}, source));
  assert.doesNotThrow(() => assertCatalogPermission('farmacia', {type:'catalog.save',record:source.catalogos.find(c=>c.tipo==='ubicaciones')}, source));
  assert.throws(() => assertCatalogPermission('farmacia', {type:'catalog.save',record:{...medicine,tipo:'ubicaciones'}}, source), /permiso/);
  const updated = applyCommand(source, {type:'catalog.save',record:{...medicine,nombre:'Nombre actualizado'}});
  assert.deepEqual(updated.existencias, source.existencias);
});
test('autenticación comprueba contraseña, rol y estado activo', async () => {
  assert.deepEqual(await authenticateAccount(accounts,'admin','Sivet2026!','administrador'), {username:'admin',role:'administrador'});
  assert.equal(await authenticateAccount(accounts,'admin','incorrecta','administrador'), null);
  assert.equal(await authenticateAccount(accounts,'farmacia','Sivet2026!','administrador'), null);
  assert.equal(await authenticateAccount(accounts.map(a=>({...a,active:false})),'admin','Sivet2026!','administrador'), null);
  assert.equal(await authenticateAccount(accounts,'desconocido','Sivet2026!','administrador'), null);
});
test('administración conserva acceso propio y al menos un administrador', () => {
  assert.throws(() => validateAccountChange(accounts,{username:'admin',role:'administrador',active:false},'admin'), /tu cuenta/);
  assert.throws(() => validateAccountChange(accounts,{username:'admin',role:'farmacia',active:true},'otro'), /administrador activo/);
  assert.throws(() => validateAccountChange(accounts,{username:'nuevo',role:'bodega',active:true,password:'123'},'admin'), /8 caracteres/);
  assert.doesNotThrow(() => validateAccountChange(accounts,{username:'farmacia',role:'farmacia',active:false},'admin'));
});
test('salidas rechazan ubicaciones inactivas antes de descontar stock', () => {
  const source = structuredClone(fixtures); source.catalogos.filter(c=>c.tipo==='ubicaciones').forEach(c=>c.activo=false);
  assert.throws(() => applyCommand(source,{type:'pharmacy.dispatch',id:'bad-location',area:'Consultorio 1',destino:'HOSPITAL',nota:'',items:[{stockId:'farmacia-stock-1',cantidad:1}]}), /ubicación activa/);
});
const db = () => structuredClone(fixtures);
const change = (source, id, estado, observacion = '') => applyCommand(source, { type: 'request.status', id, estado, observacion });
const receive = (source, id, overrides = {}) => applyCommand(source, { type: 'request.receive', id, receiver: 'Farmacia test', note: '', mode: 'confirm', checks: source.solicitudes.find(r => r.id === id).items.map(i => { const s = source.existencias.find(s => s.id === i.stockId); return { stockId: i.stockId, cantidad: i.cantidad, lote: s.lote, vencimiento: s.vencimiento, conforme: true }; }), ...overrides });

test('envío mantiene stock en tránsito hasta verificar recepción', () => {
  const original = db();
  const updated = change(original, 'SOL-DEMO-003', 'ENVIADO');
  assert.equal(updated.existencias.find(s => s.id === 'stock-3').cantidad, 230);
  assert.equal(updated.existencias.find(s => s.id === 'transito-SOL-DEMO-003-stock-3').cantidad, 20);
  assert.equal(updated.existencias.find(s => s.id === 'farmacia-stock-3'), undefined);
  assert.equal(updated.existencias.reduce((a,s) => a+s.cantidad,0), original.existencias.reduce((a,s) => a+s.cantidad,0));
  assert.equal(updated.movimientos.filter(m => m.tipo === 'SALIDA').length, original.movimientos.filter(m => m.tipo === 'SALIDA').length);
  assert.equal(original.existencias.find(s => s.id === 'stock-3').cantidad, 250);
});
test('despacho para casa resta Farmacia y conserva destino y área', () => {
  const command = { type: 'pharmacy.dispatch', id: 'SAL-test', area: 'Consulta externa', destino: 'CASA', nota: '', items: [{ stockId: 'farmacia-stock-1', cantidad: 20 }], actor: 'Operador' };
  const updated = applyCommand(db(), command);
  assert.equal(updated.existencias.find(s => s.id === 'farmacia-stock-1').cantidad, 0);
  const m = updated.movimientos.at(-1);
  assert.equal(m.tipo, 'SALIDA'); assert.equal(m.destino, 'CASA'); assert.equal(m.area, 'Consulta externa');
  assert.throws(() => applyCommand(updated, command), /ya fue registrada/);
  assert.equal(updated.actividad.at(-1).usuario, 'Operador');
});
test('administración hospitalaria completa el ciclo sin repetir entrega', () => {
  let updated = change(db(), 'SOL-DEMO-003', 'ENVIADO');
  assert.throws(() => change(updated, 'SOL-DEMO-003', 'ENVIADO'), /estado/);
  assert.throws(() => change(updated, 'SOL-DEMO-003', 'DESPACHADO'), /estado/);
  updated = receive(updated, 'SOL-DEMO-003');
  updated = applyCommand(updated, { type: 'pharmacy.dispatch', id: 'SAL-hospital', area: 'Consultorio 1', destino: 'HOSPITAL', nota: '', items: [{ stockId: 'farmacia-stock-3', cantidad: 20 }] });
  assert.equal(updated.movimientos.at(-1).destino, 'HOSPITAL');
  assert.equal(updated.existencias.find(s => s.id === 'farmacia-stock-3').cantidad, 0);
});
test('stock insuficiente cancela toda la transacción', () => {
  const original = db(); original.existencias.find(s => s.id === 'stock-3').cantidad = 1;
  const before = structuredClone(original);
  assert.throws(() => change(original, 'SOL-DEMO-003', 'ENVIADO'), /Stock insuficiente/);
  assert.deepEqual(original, before);
});
test('vencimiento impide entrega y despacho', () => {
  const original = db(); original.existencias.find(s => s.id === 'stock-3').vencimiento = '2020-01-01';
  assert.throws(() => change(original, 'SOL-DEMO-003', 'ENVIADO'), /vencido/);
});
test('rechazo exige motivo y no modifica stock', () => {
  const original = db();
  assert.throws(() => change(original, 'SOL-DEMO-001', 'RECHAZADO'), /motivo/);
  const updated = change(original, 'SOL-DEMO-001', 'RECHAZADO', 'Solicitud duplicada');
  assert.equal(updated.solicitudes.find(r => r.id === 'SOL-DEMO-001').observacion, 'Solicitud duplicada');
  assert.deepEqual(updated.existencias, original.existencias);
});
test('solicitud abastece Farmacia sin destino final y valida cantidades y lotes', () => {
  const original = db(); const request = { ...original.solicitudes.find(r => r.id === 'SOL-DEMO-001'), id: 'test' };
  for (const cantidad of [0, -1, 1.5, 99999, NaN]) assert.throws(() => applyCommand(original, { type: 'request.create', request: { ...request, items: [{ stockId: 'stock-1', cantidad }] } }));
  const created = applyCommand(original, { type: 'request.create', request: { ...request, destino: undefined } });
  assert.equal(created.solicitudes.at(-1).area, 'Farmacia');
  assert.equal(created.solicitudes.at(-1).destino, undefined);
  assert.throws(() => applyCommand(original, { type: 'request.create', request: { ...request, items: [...request.items, ...request.items] } }), /repetir/);
});

test('aprobación verifica stock, reserva cantidades y notifica a Farmacia', () => {
  const original = db();
  const updated = change(original, 'SOL-DEMO-001', 'EN PREPARACION');
  assert.equal(availableStock(updated, 'stock-1'), 110);
  assert.equal(updated.existencias.find(s => s.id === 'stock-1').cantidad, 120);
  assert.equal(updated.notificaciones.at(-1).rol, 'farmacia');
  assert.equal(updated.notificaciones.at(-1).titulo, 'Solicitud aprobada');
  const invalid = db(); invalid.existencias.find(s => s.id === 'stock-1').cantidad = 1;
  assert.throws(() => change(invalid, 'SOL-DEMO-001', 'EN PREPARACION'), /Stock insuficiente/);
});
test('dos solicitudes no pueden reservar las mismas existencias', () => {
  let source = db(); source.existencias.find(s => s.id === 'stock-1').cantidad = 10;
  source.solicitudes.push({ ...source.solicitudes.find(r => r.id === 'SOL-DEMO-001'), id: 'SOL-competidora' });
  source = change(source, 'SOL-DEMO-001', 'EN PREPARACION');
  assert.throws(() => change(source, 'SOL-competidora', 'EN PREPARACION'), /Stock insuficiente/);
  source = change(source, 'SOL-DEMO-001', 'RECHAZADO', 'Liberar reserva');
  assert.equal(availableStock(source, 'stock-1'), 10);
});
test('recepción correcta acredita stock una sola vez', () => {
  const original = db();
  const updated = receive(original, 'SOL-DEMO-008');
  assert.equal(updated.existencias.find(s => s.id === 'farmacia-stock-2').cantidad, 5);
  assert.equal(updated.existencias.find(s => s.id === 'transito-SOL-DEMO-008-stock-2').cantidad, 0);
  assert.equal(updated.solicitudes.find(r => r.id === 'SOL-DEMO-008').receptor, 'Farmacia test');
  assert.equal(updated.notificaciones.at(-1).rol, 'bodega');
  assert.throws(() => receive(updated, 'SOL-DEMO-008'), /pendiente/);
});
test('diferencias bloquean ingreso y despacho; Bodega recibe aviso y responde', () => {
  const original = db();
  const wrong = [{ stockId: 'stock-2', cantidad: 3, lote: 'LOTE-002', vencimiento: '2028-12-31', conforme: true }];
  assert.throws(() => receive(original, 'SOL-DEMO-008', { checks: wrong }), /diferencias/);
  let updated = receive(original, 'SOL-DEMO-008', { checks: wrong, note: 'Faltan 2 tabletas', mode: 'report' });
  assert.equal(updated.solicitudes.find(r => r.id === 'SOL-DEMO-008').estado, 'ENVIADO');
  assert.equal(updated.existencias.find(s => s.id === 'farmacia-stock-2'), undefined);
  assert.equal(updated.notificaciones.at(-1).titulo, 'Diferencia reportada por Farmacia');
  updated = applyCommand(updated, { type: 'request.review', id: 'SOL-DEMO-008', note: 'Revisado físicamente; verificar las dos unidades del segundo empaque.' });
  assert.equal(updated.notificaciones.at(-1).rol, 'farmacia');
  updated = receive(updated, 'SOL-DEMO-008');
  assert.equal(updated.solicitudes.find(r => r.id === 'SOL-DEMO-008').incidencia.resuelta, true);
});
test('lote o vencimiento distintos impiden conformidad', () => {
  const original = db();
  assert.throws(() => receive(original, 'SOL-DEMO-008', { checks: [{ stockId: 'stock-2', cantidad: 5, lote: 'OTRO', vencimiento: '2028-12-31', conforme: true }] }), /diferencias/);
  assert.throws(() => receive(original, 'SOL-DEMO-008', { checks: [{ stockId: 'stock-2', cantidad: 5, lote: 'LOTE-002', vencimiento: '2029-12-31', conforme: true }] }), /diferencias/);
});
test('notificaciones guardan lectura por usuario sin duplicarla', () => {
  let updated = applyCommand(db(), { type: 'notification.read', id: 'not-demo-1', user: 'farmacia:test' });
  updated = applyCommand(updated, { type: 'notification.read', id: 'not-demo-1', user: 'farmacia:test' });
  assert.deepEqual(updated.notificaciones.find(n => n.id === 'not-demo-1').leidaPor, ['farmacia:test']);
});
test('recepción aumenta stock y guarda movimiento solo una vez', () => {
  const original = db(); const receipt = { id: 'REC-test', proveedorId: 'prov-1', fecha: today(), responsable: 'Test', items: [{ productoId: 'med-1', lote: 'LOTE-001', vencimiento: '2028-12-31', cantidad: 10 }] };
  const updated = applyCommand(original, { type: 'receipt.create', receipt });
  assert.equal(updated.existencias.find(s => s.id === 'stock-1').cantidad, 130);
  assert.equal(updated.movimientos.at(-1).cantidad, 10);
  assert.throws(() => applyCommand(updated, { type: 'receipt.create', receipt }), /ya existe/);
});
test('contactos validan correo y teléfono y guardan varios valores', () => {
  const original = db(); const record = original.catalogos.find(p => p.id === 'prov-1');
  const updated = applyCommand(original, { type: 'catalog.save', record: { ...record, correos: ['uno@example.com', 'dos@example.org'] } });
  assert.equal(updated.catalogos.find(p => p.id === record.id).correos.length, 2);
  assert.throws(() => applyCommand(original, { type: 'catalog.save', record: { ...record, correos: ['invalido'] } }), /correos/);
  assert.throws(() => applyCommand(original, { type: 'catalog.save', record: { ...record, telefonos: ['abc'] } }), /telefónicos/);
});
test('dashboard ordena áreas por despacho, excluye traslados y respeta fechas', () => {
  const summary = selectDashboard(db(), 'custom', '2026-10-01', '2026-10-05', 'todas', 'todas');
  assert.deepEqual(summary.areaData.map(a => a.total), [30,25,15]);
  assert.equal(summary.areaData[0].area, 'Quirófano');
  const empty = selectDashboard(db(), 'custom', '2026-09-01', '2026-09-30', 'todas', 'todas');
  assert.equal(empty.areaData.length, 0);
});
test('tablas y gráficas del reporte corresponden al mismo filtro', () => {
  const reports = selectReports(db(), 'custom', '2026-10-01', '2026-10-05', 'todas', 'Material Médico');
  assert.equal(reports.tables.salidas_area.data.reduce((n,a) => n+a.total,0), 70);
  assert.equal(reports.charts.salidas_area.reduce((n,a) => n+a.total,0), 70);
  assert.ok(reports.tables.movimientos.data.every(m => m.categoria === 'Material Médico'));
  const medicine = selectReports(db(), 'custom', '2026-10-01', '2026-10-05', 'todas', 'Medicamentos');
  assert.equal(medicine.charts.salidas_area.length, 0);
});

test('borrador no mueve stock; confirmar conserva factura y adjunto una sola vez', () => {
  const source = db(); const receipt = { id: 'draft-test', proveedorId: 'prov-1', fecha: today(), responsable: 'Test', documento: 'FAC-TEST', evidencia: { nombre: 'factura.pdf', contenido: 'data:application/pdf;base64,JVBERg==' }, items: [{ productoId: 'med-1', lote: 'LOTE-001', vencimiento: '2028-12-31', cantidad: 3 }] };
  const draft = applyCommand(source, { type: 'receipt.draft', receipt });
  assert.deepEqual(draft.existencias, source.existencias);
  const confirmed = applyCommand(draft, { type: 'receipt.create', receipt });
  assert.equal(confirmed.recepciones.filter(r => r.id === receipt.id).length, 1);
  assert.equal(confirmed.recepciones.at(-1).evidencia.nombre, 'factura.pdf');
  assert.equal(confirmed.existencias.find(s => s.id === 'stock-1').cantidad, 123);
  assert.throws(() => applyCommand(confirmed, { type: 'receipt.create', receipt: { ...receipt, id: 'duplicate' } }), /factura/);
});
test('devolución bloquea productos sin acreditarlos automáticamente a Bodega', () => {
  const source = db(); const returned = receive(source, 'SOL-DEMO-008', { mode: 'return', note: 'Empaque dañado' });
  assert.equal(returned.solicitudes.find(r => r.id === 'SOL-DEMO-008').estado, 'DEVUELTO');
  assert.equal(returned.existencias.find(s => s.id === 'stock-2').cantidad, source.existencias.find(s => s.id === 'stock-2').cantidad);
  assert.equal(returned.existencias.find(s => s.id === 'transito-SOL-DEMO-008-stock-2').ubicacion, 'En revisión');
  assert.throws(() => receive(returned, 'SOL-DEMO-008'), /pendiente/);
  assert.equal(returned.notificaciones.at(-1).rol, 'bodega');
});
test('salida independiente admite cantidades parciales sin alterar solicitud recibida', () => {
  const source = db(); const updated = applyCommand(source, { type: 'pharmacy.dispatch', id: 'partial', area: 'Radiografía', destino: 'HOSPITAL', nota: '', items: [{ stockId: 'farmacia-stock-1', cantidad: 3 }] });
  assert.equal(updated.existencias.find(s => s.id === 'farmacia-stock-1').cantidad, 17);
  assert.deepEqual(updated.solicitudes, source.solicitudes);
  const before = structuredClone(source);
  assert.throws(() => applyCommand(source, { type: 'pharmacy.dispatch', id: 'bad', area: 'Consultorio 2', destino: 'CASA', nota: '', items: [{ stockId: 'farmacia-stock-1', cantidad: 100 }] }), /insuficiente/);
  assert.deepEqual(source, before);
});
test('auditoría filtra fechas y localidad y coincide con la gráfica', () => {
  const reports = selectReports(db(), 'custom', '2026-10-01', '2026-10-05', 'Farmacia', 'todas');
  assert.ok(reports.tables.auditoria.data.every(a => a.localidad === 'Farmacia'));
  assert.equal(reports.charts.auditoria.reduce((n,a) => n+a.cantidad,0), reports.tables.auditoria.data.length);
});
