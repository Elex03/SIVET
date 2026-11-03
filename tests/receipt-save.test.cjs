const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const axios = require('axios');
const { test } = require('node:test');
const sessionListeners = [];
global.window = { addEventListener: (event, fn) => { if (event === 'sivet-session') sessionListeners.push(fn); } };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
let backend;
require.cache[path.resolve('src/shared/api/client.ts')] = { exports: { apiData: (url, method = 'GET', body) => backend.request(url, method, body) } };
const { saveReceipt, ReceiptConflictError } = require('../src/shared/api/receiptSave.ts');
const { emptyDatabase } = require('../src/shared/api/domain.ts');
let next = 0;
const httpError = (status, code) => new axios.AxiosError(code || 'Error', 'ERR_BAD_RESPONSE', {}, null, { status, data: { error: { code } } });

function setup(lines = 1) {
  sessionListeners.forEach(fn => fn());
  const db = structuredClone(emptyDatabase);
  db.catalogos = [{ id: 'medicamentos:1', tipo: 'medicamentos', activo: true }];
  const receipt = { id: `REC-TEST-${++next}`, proveedorId: '', tipoIngreso: 'DONACION', donante: 'Fundación', fecha: '2026-11-02', responsable: 'admin', total: 100,
    items: Array.from({ length: lines }, (_, i) => ({ productoId: 'medicamentos:1', lote: `LOTE-${i}`, vencimiento: null, cantidad: i + 1 })) };
  const calls = [], lots = new Map();
  const joined = details => details.map(d => ({ ...d, lotes_id_lote: [...lots.values()].find(lot => lot.id_lote === d.id_lote) }));
  let actual, savedPayload, before, after, commits = 0, uploads = 0;
  backend = {
    async request(url, method, body) {
      calls.push({ url, method, body: structuredClone(body) });
      if (before) await before(url, method, body);
      let response;
      if (url === '/lotes/resolver') {
        response = body.lotes.map(lot => {
          const key = `${lot.id_medicamento}:${lot.numero_lote}`;
          if (!lots.has(key)) lots.set(key, { ...lot, id_lote: lots.size + 1, estado: true });
          return lots.get(key);
        });
      } else if (url === '/recepciones/borradores') {
        if (actual) throw httpError(409, 'DUPLICATE_NUMBER');
        savedPayload = structuredClone(body);
        actual = { ...body, id_recepcion: 900, version: 1, estado: 'BORRADOR', detalle_recepciones_id_recepcion_list: joined(body.detalles) };
        response = actual;
      } else if (url === '/recepciones/900' && method === 'GET') response = actual;
      else if (url === '/recepciones/900' && method === 'PATCH') {
        if (body.version !== actual.version) throw httpError(409, 'VERSION_CONFLICT');
        savedPayload = structuredClone(body);
        actual = { ...actual, ...body, version: actual.version + 1, detalle_recepciones_id_recepcion_list: joined(body.detalles) };
        response = actual;
      } else if (url === '/recepciones/900/confirmar') {
        if (body.version !== actual.version || actual.estado === 'COMPLETADA') throw httpError(409, 'VERSION_CONFLICT');
        commits++; actual = { ...actual, estado: 'COMPLETADA', version: actual.version + 1 }; response = actual;
      } else throw new Error(`Unexpected ${method} ${url}`);
      if (after) await after(url, method, body);
      return structuredClone(response);
    },
  };
  const list = async (url, params) => {
    calls.push({ url, method: 'GET', params });
    assert.equal(url, '/recepciones');
    return actual?.numero_recepcion === params.q ? [structuredClone(actual)] : [];
  };
  const upload = async () => { uploads++; };
  return { db, receipt, calls, lots, list, upload, save: type => saveReceipt({ type: type || 'receipt.create', receipt }, db, list, upload),
    writes: () => calls.filter(c => c.method !== 'GET'), commits: () => commits, uploads: () => uploads,
    setBefore: fn => { before = fn; }, setAfter: fn => { after = fn; }, getActual: () => actual,
    setActual: value => { actual = value; }, payload: () => savedPayload };
}

test('168 líneas completas hacen resolver + borrador + confirmar, sin consultas por lote', async () => {
  const f = setup(168); await f.save();
  assert.deepEqual(f.writes().map(c => c.url), ['/lotes/resolver', '/recepciones/borradores', '/recepciones/900/confirmar']);
  assert.equal(f.calls.length, 3);
  assert.equal(f.writes()[0].body.lotes.length, 168);
  assert.equal(f.payload().detalles.length, 168);
  assert.deepEqual(f.payload().detalles.map(d => d.cantidad), f.receipt.items.map(i => String(i.cantidad)));
  assert.equal(f.commits(), 1);
});
test('lote duplicado, medicamento inactivo y más de 250 líneas se rechazan antes de escribir', async () => {
  const duplicate = setup(2); duplicate.receipt.items[1].lote = ' lote-0 ';
  await assert.rejects(() => duplicate.save(), /repetidos/); assert.equal(duplicate.calls.length, 0);
  const inactive = setup(); inactive.db.catalogos[0].activo = false;
  await assert.rejects(() => inactive.save(), /inactivo/); assert.equal(inactive.calls.length, 0);
  const excessive = setup(251);
  await assert.rejects(() => excessive.save(), /250/); assert.equal(excessive.calls.length, 0);
});
test('QR opcional se envía null, fabricación se conserva y COMPRA requiere fecha', async () => {
  const f = setup(); f.receipt.items[0].codigoLote = '  '; f.receipt.items[0].fabricacion = '2026-01-01';
  await f.save('receipt.draft');
  assert.equal(f.writes()[0].body.lotes[0].codigo_lote, null);
  assert.equal(f.writes()[0].body.lotes[0].fecha_fabricacion, '2026-01-01');
  assert.equal(f.commits(), 0);
  const purchase = setup(); purchase.receipt.tipoIngreso = 'COMPRA';
  await assert.rejects(() => purchase.save(), /vencimiento/); assert.equal(purchase.calls.length, 0);
});
test('LOT_CONFLICT atómico no guarda recepción ni intenta corregir metadatos automáticamente', async () => {
  const f = setup(2); f.setBefore(url => { if (url === '/lotes/resolver') throw httpError(409, 'LOT_CONFLICT'); });
  await assert.rejects(() => f.save(), error => error.response?.data.error.code === 'LOT_CONFLICT');
  assert.equal(f.calls.length, 1); assert.equal(f.lots.size, 0); assert.equal(f.commits(), 0);
});
test('respuesta perdida del resolver reusa sus IDs con otra resolución en bloque', async () => {
  const f = setup(2); let lost = true;
  f.setAfter(url => { if (url === '/lotes/resolver' && lost) { lost = false; throw new Error('Respuesta perdida'); } });
  await assert.rejects(() => f.save());
  assert.equal(f.lots.size, 2);
  await f.save();
  assert.equal(f.lots.size, 2); assert.equal(f.writes().filter(c => c.url === '/lotes/resolver').length, 2);
  assert.equal(f.commits(), 1); assert.ok(!f.calls.some(c => c.url === '/lotes' || c.method === 'DELETE'));
});
test('fallo del borrador conserva lotes sin stock, número y paso alcanzado', async () => {
  const f = setup(); let fail = true;
  f.setBefore(url => { if (url === '/recepciones/borradores' && fail) { fail = false; throw httpError(400); } });
  await assert.rejects(() => f.save());
  const number = f.writes().find(c => c.url === '/recepciones/borradores').body.numero_recepcion;
  f.receipt.documento = 'NO-CAMBIAR-NUMERO';
  await f.save();
  assert.equal(f.writes().filter(c => c.url === '/lotes/resolver').length, 1);
  assert.ok(f.writes().filter(c => c.url === '/recepciones/borradores').every(c => c.body.numero_recepcion === number));
  assert.ok(f.calls.some(c => c.method === 'GET' && c.params?.q === number));
  assert.equal(f.lots.size, 1); assert.equal(f.commits(), 1);
});
test('POST perdido consulta la recepción existente y no duplica el borrador', async () => {
  const f = setup(); let fail = true;
  f.setAfter(url => { if (url === '/recepciones/borradores' && fail) { fail = false; throw new Error('Respuesta perdida'); } });
  await f.save();
  assert.equal(f.writes().filter(c => c.url === '/recepciones/borradores').length, 1);
  assert.ok(f.calls.some(c => c.params?.q === f.receipt.id)); assert.equal(f.commits(), 1);
});
test('confirmación perdida se reconcilia como éxito sin volver a acreditar stock', async () => {
  const f = setup(); let fail = true;
  f.setAfter(url => { if (url.endsWith('/confirmar') && fail) { fail = false; throw new Error('Respuesta perdida'); } });
  await f.save(); await f.save();
  assert.equal(f.commits(), 1); assert.equal(f.writes().length, 3);
});
test('429 en confirmación conserva el borrador y reintenta solo después de leer estado', async () => {
  const f = setup(); let fail = true;
  f.setBefore(url => { if (url.endsWith('/confirmar') && fail) { fail = false; throw httpError(429); } });
  await assert.rejects(() => f.save()); assert.equal(f.getActual().estado, 'BORRADOR');
  const before = f.calls.length; await f.save();
  assert.equal(f.calls[before].method, 'GET');
  assert.equal(f.writes().filter(c => c.url === '/lotes/resolver').length, 1);
  assert.equal(f.writes().filter(c => c.url === '/recepciones/borradores').length, 1);
  assert.equal(f.commits(), 1);
});
test('conflicto de versión carga datos actuales y requiere revisión antes de escribir', async () => {
  const f = setup(); await f.save('receipt.draft');
  f.setActual({ ...f.getActual(), version: 2, donante: 'Cambio de otro usuario' });
  const writes = f.writes().length;
  let conflict;
  await assert.rejects(() => f.save(), error => { conflict = error; return error instanceof ReceiptConflictError; });
  assert.equal(f.writes().length, writes);
  assert.equal(conflict.currentReceipt.version, 2);
  assert.equal(f.receipt.donante, 'Fundación');
  // Explicitly loading the server copy is the user's reconciliation decision.
  Object.assign(f.receipt, conflict.currentReceipt);
  f.db.recepciones = [conflict.currentReceipt];
  await f.save(); assert.equal(f.commits(), 1);
  assert.equal(f.writes().findLast(c => c.method === 'PATCH').body.version, 2);
});
test('fallar después del adjunto no vuelve a resolver, guardar ni subir el archivo', async () => {
  const f = setup(); f.receipt.evidencia = { nombre: 'acta.pdf', contenido: 'data:application/pdf;base64,YQ==' };
  let fail = true;
  f.setBefore(url => { if (url.endsWith('/confirmar') && fail) { fail = false; throw httpError(400); } });
  await assert.rejects(() => f.save()); await f.save();
  assert.equal(f.uploads(), 1); assert.equal(f.writes().filter(c => c.url === '/lotes/resolver').length, 1); assert.equal(f.commits(), 1);
});
test('PATCH con respuesta perdida lee la versión guardada sin repetir la escritura', async () => {
  const f = setup(); await f.save('receipt.draft');
  f.receipt.items[0].cantidad = 5; let lost = true;
  f.setAfter((url, method) => { if (method === 'PATCH' && lost) { lost = false; throw new Error('Respuesta perdida'); } });
  await f.save();
  assert.equal(f.writes().filter(c => c.method === 'PATCH').length, 1);
  assert.equal(f.writes().at(-1).body.version, 2);
  assert.equal(f.commits(), 1);
});
test('409 de número duplicado consulta y reconcilia la recepción sin renumerarla', async () => {
  const f = setup(); await f.save('receipt.draft');
  const original = f.getActual().numero_recepcion;
  f.receipt.id = `REC-RECONCILE-${++next}`; f.receipt.documento = original;
  await f.save();
  assert.equal(f.writes().filter(c => c.url === '/recepciones/borradores').length, 2);
  assert.ok(f.calls.some(c => c.params?.q === original));
  assert.equal(f.getActual().numero_recepcion, original); assert.equal(f.commits(), 1);
});
test('recepción completada conocida se reconoce por lectura antes de resolver o escribir', async () => {
  const f = setup(); await f.save();
  const { mapReceipt } = require('../src/shared/api/apiMapping.ts');
  const saved = mapReceipt(f.getActual());
  Object.assign(f.receipt, saved); f.db.recepciones = [saved];
  const writes = f.writes().length;
  await f.save();
  assert.equal(f.writes().length, writes); assert.equal(f.commits(), 1);
});
test('omitir QR conserva el código existente y no intenta PATCH de metadatos', async () => {
  const f = setup();
  f.lots.set('1:LOTE-0', { id_lote: 44, id_medicamento: 1, numero_lote: 'LOTE-0', fecha_vencimiento: null, codigo_lote: 'ORIGINAL', estado: true });
  await f.save();
  assert.equal(f.writes()[0].body.lotes[0].codigo_lote, null);
  assert.equal(f.lots.get('1:LOTE-0').codigo_lote, 'ORIGINAL');
  assert.equal(f.payload().detalles[0].id_lote, 44);
  assert.ok(!f.writes().some(c => c.method === 'PATCH'));
});
test('cantidades no representables, códigos repetidos y lotes inactivos no se confirman', async () => {
  const tiny = setup(); tiny.receipt.items[0].cantidad = 0.0000000000001;
  await assert.rejects(() => tiny.save(), /sin redondearla/); assert.equal(tiny.calls.length, 0);
  const codes = setup(2); codes.receipt.items.forEach(item => { item.codigoLote = 'REPETIDO'; });
  await assert.rejects(() => codes.save(), /código/); assert.equal(codes.calls.length, 0);
  const inactive = setup(); inactive.lots.set('1:LOTE-0', { id_lote: 1, estado: false });
  await assert.rejects(() => inactive.save(), /inactivo/); assert.equal(inactive.commits(), 0);
});
