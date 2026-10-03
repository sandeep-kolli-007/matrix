const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');

const jsx = (type, props) => ({ type, props });
let slots, index, completed, alerts, fail, appearance;
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/onboarding.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(code, { exports: exportsObject, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (name === 'react') return {
    useState(initial) { const key = index++; if (!(key in slots)) slots[key] = initial; return [slots[key], value => { slots[key] = value; }]; },
    useRef(initial) { const key = index++; if (!(key in slots)) slots[key] = { current: initial }; return slots[key]; },
  };
  if (name === 'react-native') return { Alert: { alert() { alerts++; } }, Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: { create: x => x } };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
  if (name === 'expo-symbols') return { SymbolView: 'SymbolView' };
  if (name.includes('matrix-theme')) return { matrixTheme: () => ({
    bg: '#000', panel: '#111', raised: '#222', text: '#fff', muted: '#aaa',
    line: '#333', accent: '#5B8CFF', onAccent: '#fff', selected: '#18233A'
  }) };
  if (name.includes('lifeos-provider')) return { useLifeOS: () => ({ appearance,
    completeOnboarding: async () => { if (fail) throw Error('storage failed'); completed++; },
    toggleAppearance: async () => { appearance = appearance === 'dark' ? 'light' : 'dark'; },
  }) };
  throw Error(name);
} });
function render() { index = 0; return exportsObject.Onboarding(); }
function nodes(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)]; }
function press(tree, text) {
  const target = nodes(tree).find(n => n.type === 'Pressable' && JSON.stringify(n.props.children).includes(text));
  assert.ok(target, text); target.props.onPress();
}
(async () => {
  for (const theme of ['light', 'dark']) {
    slots = []; completed = 0; alerts = 0; fail = false; appearance = theme;
    press(render(), 'Continue');
    assert.equal(slots[0], 1); assert.equal(completed, 0);
    press(render(), 'Back'); assert.equal(slots[0], 0);
    press(render(), 'Continue'); press(render(), 'Continue');
    assert.equal(slots[0], 2); assert.equal(completed, 0);
    fail = true; press(render(), 'Start using MATRIX');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(alerts, 1); assert.equal(completed, 0); assert.equal(slots[1], false);
    fail = false; const finalStep = render(); press(finalStep, 'Start using MATRIX'); press(finalStep, 'Start using MATRIX');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(completed, 1, 'rapid double tap must save only once');
  }
  console.log('PASS: three onboarding steps, back navigation, save failure/retry, double-tap guard in both themes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
