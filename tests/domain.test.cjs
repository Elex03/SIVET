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
const { chartRows } = require('../src/features/Reportes/chartOptions.ts');
function donationReceipt(patch = {}) {
  const product = fixtures.catalogos.find(p => p.tipo === 'medicamentos' && p.activo);
  return { id: 'DON-TEST', tipoIngreso: 'DONACION', donante: 'Fundación de prueba', proveedorId: '', fecha: today(), responsable: 'bodega', documento: 'ACTA-TEST', items: [{ productoId: product.id, lote: 'DON-TEST-LOTE', vencimiento: null, cantidad: 12 }], ...patch };
}
test('salida por registro convierte ml desde frascos y conserva modalidad y cantidades', () => {
  const db = structuredClone(fixtures);
  const product = db.catalogos.find(p => p.tipo === 'medicamentos');
  product.unidad = 'Frasco'; product.contenidoMl = 100;
  db.existencias.push({ id: 'liquido', productoId: product.id, lote: 'LIQ', cantidad: 1, vencimiento: '2099-12-31', ubicacion: 'Farmacia' }, { id: 'liquido2', productoId: product.id, lote: 'LIQ2', cantidad: 1, vencimiento: '2099-12-31', ubicacion: 'Farmacia' });
  const command = { type: 'pharmacy.dispatch', id: 'SAL-ML', area: db.catalogos.find(c => c.tipo === 'ubicaciones' && c.activo).nombre, nota: '', items: [{ stockId: 'liquido', cantidad: 5, unidadSalida: 'ML', destino: 'HOSPITAL' }, { stockId: 'liquido2', cantidad: 0.5, unidadSalida: 'ML', destino: 'CASA' }] };
  const saved = applyCommand(db, command);
  assert.equal(saved.existencias.find(s => s.id === 'liquido').cantidad, 0.95);
  assert.equal(saved.existencias.find(s => s.id === 'liquido2').cantidad, 0.995);
  const rows = saved.movimientos.filter(m => m.documento === command.id);
  assert.deepEqual(rows.map(m => [m.cantidadEntregada,m.unidadEntrega,m.destino]), [[5,'ml (cc)','HOSPITAL'],[0.5,'ml (cc)','CASA']]);
  assert.throws(() => applyCommand(saved, command), /ya fue registrada/);
  assert.throws(() => applyCommand(db, { ...command, items: [{ ...command.items[0], cantidad: 101 }] }), /insuficiente/);
  assert.throws(() => applyCommand(db, { ...command, items: [{ ...command.items[0], destino: undefined }] }), /modalidad/);
  delete product.contenidoMl;
  assert.throws(() => applyCommand(db, command), /contenido en ml/);
});
test('ingreso sin número de factura guarda total y asociación única del código de lote', () => {
  const receipt = donationReceipt({ documento: undefined, total: 250.50 });
  receipt.items[0].codigoLote = 'CODIGO-UNICO';
  const db = applyCommand(fixtures, {type:'receipt.create',receipt});
  assert.equal(db.recepciones.find(r => r.id === receipt.id).total, 250.50);
  assert.equal(db.existencias.find(s => s.lote === receipt.items[0].lote).codigoLote, 'CODIGO-UNICO');
  assert.throws(() => applyCommand(db, {type:'receipt.create',receipt:{...receipt,id:'OTRO',items:[{...receipt.items[0],lote:'OTRO'}]}}), /otro lote/);
  assert.throws(() => applyCommand(fixtures, {type:'receipt.create',receipt:{...receipt,total:-1}}), /total/);
});
test('donación sin vencimiento ingresa stock físico una sola vez y queda fuera de disponibilidad', () => {
  const receipt = donationReceipt();
  const draft = applyCommand(fixtures, { type: 'receipt.draft', receipt });
  assert.deepEqual(draft.existencias, fixtures.existencias);
  const db = applyCommand(draft, { type: 'receipt.create', receipt });
  const stock = db.existencias.find(s => s.lote === 'DON-TEST-LOTE');
  assert.equal(stock.vencimiento, null);
  assert.equal(stock.cantidad, 12);
  assert.equal(availableStock(db, stock.id), 0);
  assert.throws(() => applyCommand(db, { type: 'receipt.create', receipt }), /ya existe/);
  assert.throws(() => applyCommand(db, { type: 'receipt.create', receipt: { ...receipt, id: 'OTRA' } }), /ya está registrada/);
  assert.ok(!selectDashboard(db, '30', '', '', 'todas', 'todas').proximosVencerData.some(s => s.id === stock.id));
  const { inventoryAlerts } = require('../src/shared/api/alerts.ts');
  assert.ok(inventoryAlerts(db, 'Bodega Central').some(a => a.id === 'unknown-expiry-' + stock.id));
  const request = { ...structuredClone(fixtures.solicitudes[0]), id: 'SOL-DON', estado: 'PENDIENTE', items: [{ stockId: stock.id, cantidad: 1 }] };
  assert.throws(() => applyCommand(db, { type: 'request.create', request }), /vencido|disponible/);
});
test('donaciones validan donante y vencimiento; compras siguen exigiendo fecha', () => {
  const receipt = donationReceipt();
  for (const patch of [{ donante: '' }]) assert.throws(() => applyCommand(fixtures, { type: 'receipt.create', receipt: { ...receipt, ...patch } }), /donante/);
  for (const vencimiento of ['', '2000-01-01', 'sin fecha']) assert.throws(() => applyCommand(fixtures, { type: 'receipt.create', receipt: { ...receipt, items: [{ ...receipt.items[0], vencimiento }] } }), /vencimiento/);
  assert.throws(() => applyCommand(fixtures, { type: 'receipt.create', receipt: { ...receipt, tipoIngreso: 'COMPRA', proveedorId: fixtures.catalogos.find(p => p.tipo === 'proveedores').id } }), /vencimiento/);
  const db = applyCommand(fixtures, { type: 'receipt.create', receipt: { ...receipt, items: [{ ...receipt.items[0], vencimiento: '2099-12-31' }] } });
  assert.equal(availableStock(db, db.existencias.find(s => s.lote === 'DON-TEST-LOTE').id), 12);
});
test('reporte de donaciones incluye solo ingresos confirmados y respeta filtros en tabla y gráficas', () => {
  const receipt = donationReceipt();
  const db = applyCommand(fixtures, { type: 'receipt.create', receipt });
  db.recepciones.push({ ...receipt, id: 'BORRADOR-DON', estado: 'BORRADOR' }, { ...receipt, id: 'CANCELADO-DON', estado: 'CANCELADO' });
  const report = selectReports(db, 'custom', today(), today(), 'Bodega Central', 'todas');
  assert.equal(report.tables.donaciones.data.length, 1);
  assert.equal(report.tables.donaciones.data[0].vencimiento, 'Desconocido');
  assert.deepEqual(report.charts.donaciones, [{ name: receipt.donante, cantidad: 12, sinFecha: 12 }]);
  for (const [place, category, from, to] of [['Farmacia','todas',today(),today()], ['todas','INEXISTENTE',today(),today()], ['todas','todas','2000-01-01','2000-01-02']]) {
    const filtered = selectReports(db, 'custom', from, to, place, category);
    assert.equal(filtered.tables.donaciones.data.length, 0);
    assert.equal(filtered.charts.donaciones.length, 0);
  }
});
test('cuentas demo antiguas incorporan preparador sin alterar cuentas existentes', async () => {
  const { addDemoPreparer, authenticateAccount } = require('../src/shared/api/accountRules.ts');
  const seeds = require('../public/data/users.json');
  const old = seeds.filter(a => a.role !== 'preparador');
  const upgraded = addDemoPreparer(old,seeds);
  assert.equal(upgraded.length,old.length+1);
  assert.deepEqual(upgraded.slice(0,old.length),old);
  assert.equal((await authenticateAccount(upgraded,'preparador','Sivet2026!','preparador')).role,'preparador');
  assert.equal(await authenticateAccount(upgraded,'preparador','incorrecta','preparador'),null);
  const inactive = upgraded.map(a => a.username === 'preparador' ? {...a,active:false,hash:'custom'} : a);
  assert.strictEqual(addDemoPreparer(inactive,seeds),inactive);
  assert.equal(await authenticateAccount(inactive,'preparador','Sivet2026!','preparador'),null);
});
const { assertPreparationPermission } = require('../src/shared/api/permissions.ts');
function prepCommand(source, id, patch = {}) {
  const r = source.solicitudes.find(r => r.id === id);
  return { type: 'request.prepare', id, actor: 'preparador', version: r.preparacion?.version || 0, ready: true, lines: (r.approvedItems || r.items).map(i => { const s = source.existencias.find(s => s.id === i.stockId); return {...i, requestedStockId:i.stockId,lote:s.lote,vencimiento:s.vencimiento,comentario:'Verificado físicamente',lista:true}; }), ...patch };
}
test('preparador solo guarda checklist y no aprueba, envía ni edita catálogo', () => {
  const cmd = prepCommand(fixtures,'SOL-DEMO-002');
  for (const role of ['administrador','bodega','preparador']) assert.doesNotThrow(() => assertPreparationPermission(role,cmd));
  assert.throws(() => assertPreparationPermission('farmacia',cmd), /permiso/);
  for (const command of [{type:'request.status',estado:'ENVIADO'},{type:'catalog.save'},{type:'receipt.create'},{type:'request.review'},{type:'notification.read'}]) assert.throws(() => assertPreparationPermission('preparador',command), /solo puede preparar/);
});
test('preparación guarda avance sin stock y termina antes de permitir envío', () => {
  let source = structuredClone(fixtures); const before = structuredClone(source.existencias);
  const draft = prepCommand(source,'SOL-DEMO-002',{ready:false});
  draft.lines[0] = {...draft.lines[0],cantidad:0,lote:'',vencimiento:'',lista:false};
  source = applyCommand(source,draft);
  assert.deepEqual(source.existencias,before);
  assert.equal(source.solicitudes.find(r=>r.id===draft.id).preparacion.version,1);
  assert.throws(() => applyCommand(source,{type:'request.status',id:draft.id,estado:'LISTO PARA ENTREGA',observacion:''}), /checklist/);
  source = applyCommand(source,prepCommand(source,draft.id));
  assert.equal(source.solicitudes.find(r=>r.id===draft.id).estado,'LISTO PARA ENTREGA');
  assert.deepEqual(source.existencias,before);
  assert.equal(source.actividad.at(-1).accion,'request.prepare');
  const sent = applyCommand(source,{type:'request.status',id:draft.id,estado:'ENVIADO',observacion:''});
  assert.equal(sent.existencias.find(s=>s.id==='stock-4').cantidad, before.find(s=>s.id==='stock-4').cantidad-5);
});
test('preparación rechaza pendientes, checklist incompleto y datos discrepantes', () => {
  assert.throws(() => applyCommand(fixtures,prepCommand(fixtures,'SOL-DEMO-001')), /aprobadas/);
  const good = prepCommand(fixtures,'SOL-DEMO-002');
  for (const patch of [{lista:false},{cantidad:4},{lote:'OTRO'},{vencimiento:'2020-01-01'},{stockId:'stock-1'}]) {
    const cmd = structuredClone(good); Object.assign(cmd.lines[0],patch);
    assert.throws(() => applyCommand(fixtures,cmd));
  }
  assert.throws(() => applyCommand(fixtures,{...good,lines:[]}), /líneas/);
});
test('preparación detecta cambios concurrentes y no modifica pedidos ya listos', () => {
  const command = prepCommand(fixtures,'SOL-DEMO-002',{ready:false});
  const updated = applyCommand(fixtures,command);
  assert.throws(() => applyCommand(updated,command), /Otra persona/);
  const ready = applyCommand(updated,prepCommand(updated,command.id));
  assert.throws(() => applyCommand(ready,prepCommand(ready,command.id)), /aprobadas/);
});
test('cambio de lote al preparar conserva producto y reasigna reserva atómicamente', () => {
  const source = structuredClone(fixtures); const stock = source.existencias.find(s=>s.id==='stock-4');
  source.existencias.push({...stock,id:'otro-lote',lote:'OTRO-VALIDO',cantidad:8});
  const command = prepCommand(source,'SOL-DEMO-002');
  command.lines[0] = {...command.lines[0],stockId:'otro-lote',lote:'OTRO-VALIDO'};
  const before = availableStock(source,'stock-4');
  const updated = applyCommand(source,command);
  assert.equal(availableStock(updated,'stock-4'),before+5);
  assert.equal(availableStock(updated,'otro-lote'),3);
  assert.equal(updated.solicitudes.find(r=>r.id===command.id).approvedItems[0].stockId,'stock-4');
  source.existencias.find(s=>s.id==='otro-lote').cantidad=4;
  assert.throws(() => applyCommand(source,command), /Stock insuficiente/);
});
test('no se envía un pedido legado sin checklist y un rechazo invalida el avance', () => {
  const source = structuredClone(fixtures); delete source.solicitudes.find(r=>r.id==='SOL-DEMO-003').preparacion;
  assert.throws(() => applyCommand(source,{type:'request.status',id:'SOL-DEMO-003',estado:'ENVIADO',observacion:''}), /checklist/);
  const rejected = applyCommand(fixtures,{type:'request.status',id:'SOL-DEMO-002',estado:'RECHAZADO',observacion:'Anulada por bodega'});
  assert.throws(() => applyCommand(rejected,prepCommand(rejected,'SOL-DEMO-002')), /aprobadas/);
});
test('gráficas ordenan y limitan sin alterar los datos del reporte', () => {
  const rows = [{name:'B',stock:2},{name:'A',stock:9},{name:'C',stock:4}];
  assert.deepEqual(chartRows(rows,'stock',{sort:'desc',limit:2},false).map(r=>r.name), ['A','C']);
  assert.deepEqual(chartRows(rows,'stock',{sort:'asc'},false).map(r=>r.stock), [2,4,9]);
  assert.deepEqual(chartRows(rows,'stock',{sort:'name'},false).map(r=>r.name), ['A','B','C']);
  assert.deepEqual(rows.map(r=>r.name), ['B','A','C']);
});
test('gráficas temporales mantienen cronología y seleccionan últimos períodos', () => {
  const rows = [{name:'2026-10-03',entradas:1,salidas:3},{name:'2026-10-01',entradas:90,salidas:10},{name:'2026-10-02',entradas:2,salidas:1}];
  assert.deepEqual(chartRows(rows,'flujo',{sort:'desc',limit:2},true).map(r=>r.name), ['2026-10-02','2026-10-03']);
  assert.equal(chartRows(rows,'flujo',{limit:0},true).length, 3);
});
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

test('el saldo parcial de 200 cc se puede despachar después sin perder volumen', () => {
  const source = structuredClone(fixtures);
  const product = source.catalogos.find(p => p.tipo === 'medicamentos');
  product.unidad = 'Frasco'; product.contenidoMl = 200;
  source.existencias.push({id:'partial-volume',productoId:product.id,lote:'PARTIAL',cantidad:1,vencimiento:'2099-12-31',ubicacion:'Farmacia'});
  const send = (id,cantidad) => ({type:'pharmacy.dispatch',id,area:source.catalogos.find(c => c.tipo === 'ubicaciones' && c.activo).nombre,nota:'',items:[{stockId:'partial-volume',cantidad,unidadSalida:'ML',destino:'HOSPITAL'}]});
  const half = applyCommand(source,send('HALF',100));
  assert.equal(half.existencias.find(s => s.id === 'partial-volume').cantidad * 200,100);
  assert.throws(() => applyCommand(half,send('EXCESS',100.001)), /insuficiente/);
  const empty = applyCommand(half,send('REST',100));
  assert.equal(empty.existencias.find(s => s.id === 'partial-volume').cantidad,0);
  assert.equal(source.existencias.find(s => s.id === 'partial-volume').cantidad,1);
});
test('tabletas individuales y fracciones conservan el saldo sin descontar el empaque', () => {
  const source = structuredClone(fixtures);
  const product = source.catalogos.find(p => p.tipo === 'medicamentos');
  product.unidad = 'Tableta'; product.presentacion = 'Caja'; product.uxe = 10;
  source.existencias.push({id:'partial-tablets',productoId:product.id,lote:'TABLETS',cantidad:10,vencimiento:'2099-12-31',ubicacion:'Farmacia'});
  const send = (id,cantidad) => ({type:'pharmacy.dispatch',id,area:source.catalogos.find(c => c.tipo === 'ubicaciones' && c.activo).nombre,nota:'',items:[{stockId:'partial-tablets',cantidad,unidadSalida:'BASE',destino:'CASA'}]});
  const one = applyCommand(source,send('ONE',1));
  assert.equal(one.existencias.find(s => s.id === 'partial-tablets').cantidad,9);
  const quarter = applyCommand(one,send('QUARTER',0.25));
  assert.equal(quarter.existencias.find(s => s.id === 'partial-tablets').cantidad,8.75);
  assert.throws(() => applyCommand(quarter,send('EXCESS',9)), /insuficiente/);
  const rest = applyCommand(quarter,send('REST',8.75));
  assert.equal(rest.existencias.find(s => s.id === 'partial-tablets').cantidad,0);
});

test('PDF conserva orden y anchos del lienzo al distribuir las gráficas en carta', () => {
  const {reportRows} = require('../src/shared/utils/reportLayout.ts');
  const input = [{id:'third',order:2,width:100},{id:'second',order:1,width:40},{id:'first',order:0,width:60}];
  assert.deepEqual(reportRows(input).map(row=>row.map(c=>c.id)),[['first','second'],['third']]);
  assert.deepEqual(reportRows([{order:0,width:70},{order:1,width:50},{order:2,width:50}]).map(row=>row.length),[1,2]);
  assert.deepEqual(input.map(c=>c.id),['third','second','first']);
});
