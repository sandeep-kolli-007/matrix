const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
let state;
const jsx = (type, props) => ({ type, props });
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/app/_layout.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
vm.runInNewContext(code + '\nexports.renderShell = AppShell;', { exports: exportsObject, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
  if (name === 'expo-router') return { Stack: Object.assign(function Stack() {}, { Screen: 'Screen' }), ThemeProvider: 'ThemeProvider' };
  if (name === 'expo-splash-screen') return { preventAutoHideAsync() {} };
  if (name.includes('lifeos-provider')) return { useLifeOS: () => state };
  if (name.includes('animated-icon')) return { AnimatedSplashOverlay: 'SplashDismissal' };
  if (name.includes('onboarding')) return { Onboarding: 'Onboarding' };
  return {};
} });
function contains(node, type) {
  if (!node) return false;
  if (Array.isArray(node)) return node.some((value) => contains(value, type));
  return node.type === type || contains(node.props?.children, type);
}
state = { hydrated: false, onboarded: false, appearance: 'light' };
assert.equal(exportsObject.renderShell(), null);
for (const appearance of ['light', 'dark']) {
  state = { hydrated: true, onboarded: false, appearance };
  const firstLaunch = exportsObject.renderShell();
  assert.ok(contains(firstLaunch, 'Onboarding'));
  assert.ok(contains(firstLaunch, 'SplashDismissal'), 'First launch must mount splash dismissal');
  state.onboarded = true;
  assert.ok(contains(exportsObject.renderShell(), 'SplashDismissal'), 'Returning launch keeps splash dismissal');
}
console.log('PASS: first-launch and returning-user splash paths in both themes; hydration gate retained.');
