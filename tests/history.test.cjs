const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const axios = require('axios');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, filename);
};
const calls = [];
let reply;
require.cache[path.resolve('src/shared/api/client.ts')] = { exports: { apiClient: { get: async (url, options) => {
  calls.push({ url, options }); return { data: await reply(url, options) };
} } } };
require.cache[path.resolve('src/shared/utils/printUtils.ts')] = { exports: { generatePDFTemplate() {}, generateExcel() {} } };
const { loadHistory, loadHistoryDetail, historyDate, historyProduct, historyLocation, canReadHistory } = require('../src/shared/api/history.ts');
const Table = require('../src/shared/components/Table/Table.tsx').default;
const MedicationUses = require('../src/shared/components/MedicationUses.tsx').default;
const row = (id, overrides = {}) => ({
  id: `HIST-${id}`, id_fila: id, id_importacion: 1, fecha: '2026-01-01', tipo: 'TRASLADO',
  id_medicamento: null, medicamento: null, producto_original: 'Producto del archivo', cantidad: '12.500', unidad: null,
  ubicacion: 'BODEGA', destino: 'CUR JUIGALPA', lote_original: null, estado_revision: 'PENDIENTE', motivo_revision: 'Unidad por confirmar',
  origen_registro: 'Importado desde Excel', afecta_stock: false, solo_lectura: true,
  fuente: { archivo: 'archivo.xlsx', sha256: 'abc', hoja: 'Traslados', fila: id + 1, columna: null }, ...overrides,
});
const page = (number = 1) => ({ data: Array.from({ length: 20 }, (_, i) => row((number - 1) * 20 + i + 1)), total: 3620, page: number, limit: 20 });

test('histórico permite los cuatro perfiles de lectura y excluye PREPARADOR', () => {
  for (const role of ['administrador', 'consulta', 'bodega', 'farmacia']) assert.equal(canReadHistory(role), true);
  for (const role of ['preparador', undefined]) assert.equal(canReadHistory(role), false);
});
test('fechas de calendario, productos sin identificar y destinos explícitos conservan su evidencia', () => {
  assert.equal(historyDate('2026-01-01'), '01/01/2026');
  assert.equal(historyDate('2026-08-28'), '28/08/2026');
  assert.equal(historyDate(null), 'No documentado');
  assert.equal(historyProduct(row(1)), 'Producto del archivo');
  assert.equal(historyProduct(row(1, { producto_original: null })), 'Producto por identificar');
  assert.equal(historyProduct(row(1, { medicamento: { nombre: 'Producto identificado' } })), 'Producto identificado');
  assert.equal(historyLocation('FARMACIA'), 'Farmacia');
  assert.equal(historyLocation(null), 'No documentado');
});
test('primera consulta remota sin filtro temporal conserva pendientes y campos null', async () => {
  calls.length = 0;
  const response = page(); response.data[0].cantidad = null;
  reply = async () => response;
  const actual = await loadHistory({ page: 1, limit: 20 });
  assert.deepEqual(calls.map(c => c.url), ['/historial-movimientos']);
  assert.deepEqual(calls[0].options.params, { page: 1, limit: 20 });
  assert.equal(actual.total, 3620);
  assert.equal(actual.data.length, 20);
  assert.equal(actual.data[0].cantidad, null);
  assert.equal(actual.data[0].unidad, null);
  assert.equal(actual.data[0].medicamento, null);
  assert.equal(actual.data[0].estado_revision, 'PENDIENTE');
  assert.equal(actual.data[0].destino, 'CUR JUIGALPA');
});
test('paginación remota solicita una sola página por vez y conserva orden e IDs', async () => {
  calls.length = 0;
  reply = async (_, { params }) => page(params.page);
  const first = await loadHistory({ page: 1, limit: 20 });
  const second = await loadHistory({ page: 2, limit: 20 });
  assert.equal(calls.length, 2);
  assert.equal(first.data.at(-1).id, 'HIST-20');
  assert.equal(second.data[0].id, 'HIST-21');
  assert.equal(new Set([...first.data, ...second.data].map(r => r.id)).size, 40);
});
test('filtros autorizados y señal de cancelación se envían al servidor sin búsqueda local ni q', async () => {
  calls.length = 0;
  const signal = new AbortController().signal;
  const query = { page: 1, limit: 20, desde: '2026-01-01', hasta: '2026-08-28', id_medicamento: 15, id_importacion: 2, tipo: 'TRASLADO', ubicacion: 'FARMACIA', estado_revision: 'PENDIENTE' };
  reply = async () => page();
  await loadHistory(query, signal);
  assert.deepEqual(calls[0].options.params, query);
  assert.equal(calls[0].options.signal, signal);
  assert.equal('q' in calls[0].options.params, false);
});
test('rangos invertidos, IDs inválidos y límites excesivos no realizan consultas', async () => {
  calls.length = 0;
  for (const invalid of [{ desde: '2026-08-01', hasta: '2026-01-01' }, { id_medicamento: -1 }, { id_importacion: 1.5 }, { page: 0 }, { limit: 101 }])
    await assert.rejects(() => loadHistory({ page: 1, limit: 20, ...invalid }));
  await assert.rejects(() => loadHistoryDetail('HIST-12'));
  assert.equal(calls.length, 0);
});
test('404 de despliegue y 403 se muestran como errores; reintentar no cambia de sesión', async () => {
  calls.length = 0;
  reply = async () => { throw new axios.AxiosError('Not found', 'ERR_BAD_REQUEST', {}, null, { status: 404 }); };
  await assert.rejects(() => loadHistory({ page: 1, limit: 20 }), /desplegado/);
  reply = async () => { throw new axios.AxiosError('Forbidden', 'ERR_BAD_REQUEST', {}, null, { status: 403 }); };
  await assert.rejects(() => loadHistory({ page: 1, limit: 20 }), /permiso/);
  reply = async () => page();
  assert.equal((await loadHistory({ page: 1, limit: 20 })).data.length, 20);
  assert.ok(calls.every(c => c.url === '/historial-movimientos'));
  assert.equal(calls.length, 3);
});
test('cancelación permanece identificable y un detalle fuera de alcance devuelve error', async () => {
  reply = async () => { throw new axios.CanceledError('Canceled'); };
  await assert.rejects(() => loadHistory({ page: 1, limit: 20 }), error => axios.isCancel(error));
  reply = async () => { throw new axios.AxiosError('Not found', 'ERR_BAD_REQUEST', {}, null, { status: 404 }); };
  await assert.rejects(() => loadHistoryDetail(12), /perfil/);
});
test('detalle usa ID numérico, conserva signos originales, procedencia y normalizado null', async () => {
  calls.length = 0;
  const response = { ...row(12), original: { cantidad: '-12.5', observacion: '<script>texto</script>' }, normalizado: null };
  reply = async () => ({ data: response });
  const actual = await loadHistoryDetail(12);
  assert.equal(calls[0].url, '/historial-movimientos/12');
  assert.deepEqual(actual, response);
});
test('respuestas inválidas o movimientos operativos no se aceptan como histórico', async () => {
  for (const response of [{ data: [] }, { ...page(), page: 2 }, { ...page(), data: [row(1, { id: '1', afecta_stock: true })] }]) {
    reply = async () => response;
    await assert.rejects(() => loadHistory({ page: 1, limit: 20 }), /inválida|histórico/);
  }
});
test('tabla remota muestra los veinte registros recibidos sin segunda paginación ni orden local', () => {
  const html = renderToStaticMarkup(React.createElement(Table, { pagination: false, sortable: false, enableExport: false,
    columns: [{ id: 'nombre', label: 'Producto' }], data: page(2).data.map(r => ({ id: r.id, nombre: `Registro nº ${r.id_fila}` })), onView() {},
  }));
  assert.equal((html.match(/>Registro nº \d+</g) || []).length, 20);
  assert.ok(html.includes('Registro nº 21') && html.includes('Registro nº 40'));
  for (const forbidden of ['Mostrar', 'Página', 'Ordenar', 'Editar', 'Exportar']) assert.equal(html.includes(forbidden), false);
  const local = renderToStaticMarkup(React.createElement(Table, { columns: [{ id: 'nombre', label: 'Producto' }], data: Array.from({ length: 20 }, (_, i) => ({ id: i, nombre: `Fila local ${i}` })) }));
  assert.equal((local.match(/>Fila local \d+</g) || []).length, 10);
  assert.ok(local.includes('Mostrar') && local.includes('Página'));
});
test('indicaciones documentales se muestran escapadas con saltos de línea y sin inventar usos', () => {
  const html = renderToStaticMarkup(React.createElement(MedicationUses, { value: 'Uso documental\nFuente técnica: https://fuente.test\n<script>alert(1)</script>' }));
  assert.ok(html.includes('whitespace-pre-line'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.equal(html.includes('<script>'), false);
  assert.ok(renderToStaticMarkup(React.createElement(MedicationUses, { value: null })).includes('Uso no documentado'));
});
