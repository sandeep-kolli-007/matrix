const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function load(name) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/data', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: value => load(value.replace('./', '')), Date });
  return exports;
}
const { homeSummary } = load('home-summary');
const item = (id, kind, metadata = {}, extra = {}) => ({ id, kind, metadata, ...extra });
const empty = homeSummary([], '2026-09-09');
assert.equal(empty.progress, null); assert.equal(empty.active.length, 0);
const data = [item('overdue', 'task', { due: '2026-09-08' }), item('done', 'task', { due: '2026-09-08', completed: true }),
  item('today', 'event', { date: '2026-09-09' }), item('repeat', 'reminder', { date: '2026-09-01', repeat: 'Daily' }),
  item('urgent', 'note', { priority: 'High' }), item('archive', 'task', {}, { archivedAt: '2026-09-08' }),
  item('invalid', 'bill', { due: '2026-02-30' })];
const summary = homeSummary(data, '2026-09-09');
assert.equal(summary.progress, 50);
assert.deepEqual(Array.from(summary.overdue, x => x.id), ['overdue']);
assert.deepEqual(Array.from(summary.today, x => x.id), ['today', 'repeat']);
assert.deepEqual(Array.from(summary.urgentIds), ['overdue', 'urgent']);
assert.equal(summary.active.length, 5);
assert.equal(homeSummary(Array.from({ length: 2145 }, (_, i) => item(String(i), 'task', { completed: i % 2 === 0 })), '2026-09-09').tasks.length, 2145);
console.log('PASS: Home empty, real progress, archived/completed exclusions, urgency, recurring today and large dataset.');
