const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

// Exercise the shared submission result used by creation panels, without a DOM.
async function fixture({ reloadFails = false, saveFails = false, confirmed = true } = {}) {
  const database = { catalogos: [] };
  const notices = [];
  let loads = 0;
  let saves = 0;
  const dependencies = {
    './permissions': { assertCatalogPermission() {}, assertPreparationPermission() {} },
    './accounts': { readAccounts: async () => [] },
    react: {
      useCallback: fn => fn,
      useEffect() {},
      useRef: value => ({ current: value }),
      useState: value => [value, () => {}],
      useSyncExternalStore: (_, getSnapshot) => getSnapshot(),
    },
    './client': { apiUrl: 'https://api.test' },
    './server': {
      loadServerDatabase: async () => {
        loads++;
        if (reloadFails && loads > 1) throw new Error('Recarga fallida');
        return database;
      },
      executeServerCommand: async () => {
        saves++;
        if (saveFails) throw new Error('Guardado rechazado');
        return 'categorias:42';
      },
    },
    './domain': { emptyDatabase: database },
    'react-toastify': { toast: {
      loading: () => 'saving',
      update: (_, options) => notices.push(options.type),
      warning: () => notices.push('warning'),
      error: () => notices.push('error'),
    } },
    '../context/confirmation': { useConfirmation: () => async () => confirmed },
    '../context/auth': { useAuth: () => ({ user: { username: 'admin', role: 'administrador' } }) },
    './commandFeedback': { commandConfirmation: () => ({}), commandSuccess: () => 'Guardado' },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('src/shared/api/useSivet.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: name => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
    window: { addEventListener() {} },
  });
  const state = module.exports.useSivet();
  await state.refresh();
  return { state, notices, saves: () => saves };
}

test('el guardado confirmado permite cerrar el panel y conserva el ID del servidor', async () => {
  const { state, notices } = await fixture();
  const record = { id: 'temporal' };
  assert.equal(await state.mutate({ type: 'catalog.save', record }), true);
  assert.equal(record.id, 'categorias:42');
  assert.deepEqual(notices, ['success']);
});

test('una recarga fallida después de guardar permite cerrar y avisa sin repetir la creación', async () => {
  const { state, notices, saves } = await fixture({ reloadFails: true });
  assert.equal(await state.mutate({ type: 'catalog.save', record: {} }), true);
  assert.deepEqual(notices, ['warning', 'success']);
  assert.equal(saves(), 1);
  // Stale data blocks another write until refreshed successfully.
  assert.equal(await state.mutate({ type: 'catalog.save', record: {} }), false);
  assert.equal(saves(), 1);
});

test('un guardado rechazado mantiene abierto el formulario', async () => {
  const { state, notices } = await fixture({ saveFails: true });
  assert.equal(await state.mutate({ type: 'catalog.save', record: {} }), false);
  assert.deepEqual(notices, ['error']);
});

test('cancelar la confirmación mantiene abierto el formulario sin guardar', async () => {
  const { state, saves, notices } = await fixture({ confirmed: false });
  assert.equal(await state.mutate({ type: 'catalog.save', record: {} }), false);
  assert.equal(saves(), 0);
  assert.deepEqual(notices, []);
});

test('cancelar la eliminación no envía DELETE y un rechazo no devuelve éxito', async () => {
  const cancelled = await fixture({ confirmed: false });
  assert.equal(await cancelled.state.mutate({ type: 'medication.delete', id: 'medicamentos:1' }), false);
  assert.equal(cancelled.saves(), 0);
  const rejected = await fixture({ saveFails: true });
  assert.equal(await rejected.state.mutate({ type: 'medication.delete', id: 'medicamentos:1' }), false);
  assert.deepEqual(rejected.notices, ['error']);
});
