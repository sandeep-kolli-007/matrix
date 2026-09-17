const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const exports = cache[name] = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/data/', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (p) => load(p.replace('./', '')), Date, URL });
  return exports;
}
const { normalizeMatrixRow } = load('matrix-adapter');
const { messageThreads } = load('message-threads');
assert.equal(messageThreads([]).length, 0);
const communication = normalizeMatrixRow({ id: 'thread', entity_type: 'communication', data: { title: 'Test group', subtype: 'group_thread', unread: true, last_message_preview: 'Preview' }, created_at: '2026-09-01', updated_at: '2026-09-01' });
const call = { ...communication, id: 'call', metadata: { subtype: 'call_log' } };
assert.equal(messageThreads([communication, call]).length, 1);
assert.equal(messageThreads([communication])[0].group, true);
assert.equal(messageThreads([communication])[0].unread, true);
const draft = { id: 'draft', kind: 'message', title: 'Draft', details: 'Saved text', deviceOnly: true, createdAt: '2026-09-02', updatedAt: '2026-09-02', metadata: { threadId: 'legacy', recipient: 'Local recipient' } };
assert.equal(messageThreads([draft])[0].title, 'Local recipient');
assert.equal(messageThreads([draft])[0].messages[0].details, 'Saved text');
assert.equal(messageThreads([{ ...draft, archivedAt: '2026-09-03' }]).length, 0);
assert.equal(load('matrix-adapter').normalizeTimestamp('2026-08-30 10:44:29.302239+00'), '2026-08-30T10:44:29.302+00:00');
const row = (type, data) => ({ id: 'test', entity_type: type, data, created_at: '2026-09-07T00:00:00Z', updated_at: '2026-09-07T00:00:00Z' });
assert.equal(normalizeMatrixRow(row('task', { subtype: 'habit_instance' })).kind, 'habit');
assert.equal(normalizeMatrixRow(row('financial', { subtype: 'bill', amount: 0 })).metadata.amount, 0);
assert.equal(normalizeMatrixRow(row('task', { status: 'completed' })).metadata.completed, true);
assert.equal(normalizeMatrixRow({ ...row('task', {}), deleted_at: '2026-09-07' }), null);
assert.ok(normalizeMatrixRow(row('future_type', {})).title);
assert.equal(normalizeMatrixRow(row('person', { name: 'Sample Person' })).title, 'Sample Person');
assert.equal(typeof normalizeMatrixRow(row('automation', { action: { type: 'reminder' } })).metadata.action, 'string');
assert.equal(normalizeMatrixRow(row('health_log', { value: 0, device_only: true })).deviceOnly, true);
if (process.argv[2]) {
  const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const converted = rows.map((value) => normalizeMatrixRow(value, 'preview')).filter(Boolean);
  assert.equal(messageThreads(converted).length, rows.filter((value) => value.entity_type === 'communication' && value.data.subtype !== 'call_log' && !value.deleted_at).length);
  assert.equal(converted.length, rows.filter((value) => !value.deleted_at).length);
  assert.equal(new Set(converted.map((value) => value.id)).size, converted.length);
  assert.ok(converted.every((value) => value.title && value.kind && value.source === 'preview'));
  const types = converted.reduce((out, value) => { out[value.kind] = (out[value.kind] || 0) + 1; return out; }, {});
  console.log(JSON.stringify({ fetched: rows.length, mapped: converted.length, kinds: types }));
}
console.log('PASS: subtype mapping, zero values, completion, deletion, unknown types, missing title, nested data, privacy, and real snapshot integrity.');
