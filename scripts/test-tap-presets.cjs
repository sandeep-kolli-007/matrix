const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(name) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/data', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Date });
  return exports;
}
const { entityFields, fieldsForEntity } = load('entity-fields');
const { tapPresets } = load('tap-presets');
for (const type of Object.keys(entityFields)) {
  for (const field of fieldsForEntity(type)) {
    const choices = tapPresets(field);
    assert.ok(Array.isArray(choices));
    assert.ok(choices.every(value => typeof value === 'string' && value.length));
    if (field.options?.length) assert.equal(JSON.stringify(choices), JSON.stringify(field.options));
    if (field.keyboard === 'numeric') assert.ok(choices.every(value => Number.isFinite(Number(value))));
  }
}
assert.equal(tapPresets({ key: 'phone', keyboard: 'phone-pad' }).length, 0);
assert.equal(tapPresets({ key: 'email', keyboard: 'email-address' }).length, 0);
assert.ok(tapPresets({ key: 'weight', keyboard: 'numeric' }).includes('22.5'));
assert.ok(tapPresets({ key: 'reps', keyboard: 'numeric' }).includes('8'));
console.log('PASS: presets across all declared entity schemas, numeric values, custom contact values, and workout choices.');
