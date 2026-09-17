const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/providers/lifeos-provider.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
async function run(failedKeys, unmount = false) {
  const slots = []; let i = 0; let cleanup; let alerts = 0; let writes = 0;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react/jsx-runtime') return { jsx: () => null };
    if (name === 'react-native') return { Alert: { alert() { alerts++; } } };
    if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: {
      async getItem(key) { if (failedKeys.includes(key)) throw Error('read failure'); return key === 'lifeos:appearance' ? 'dark' : 'complete'; },
      async setItem() { writes++; },
    } };
    if (name === 'react') return {
      createContext: () => ({ Provider: 'Provider' }),
      useState(value) { const index = i++; slots[index] = value; return [value, next => { slots[index] = next; }]; },
      useMemo: fn => fn(), useEffect(fn) { cleanup = fn(); },
    };
    throw Error(name);
  } });
  exports.LifeOSProvider({ children: null });
  if (unmount) cleanup();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes, 0, 'Hydration never overwrites preferences');
  return { slots, alerts };
}
(async () => {
  assert.deepEqual((await run([])).slots, ['dark', true, true]);
  assert.deepEqual((await run(['lifeos:appearance'])).slots, ['light', true, true]);
  assert.deepEqual((await run(['lifeos:onboarded'])).slots, ['dark', false, true]);
  const both = await run(['lifeos:appearance', 'lifeos:onboarded']);
  assert.deepEqual(both.slots, ['light', false, true]); assert.equal(both.alerts, 1);
  const cancelled = await run([], true);
  assert.deepEqual(cancelled.slots, ['light', false, false]); assert.equal(cancelled.alerts, 0);
  console.log('PASS: independent preference failures, preserved onboarding/theme, no hydration writes, unmount cancellation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
