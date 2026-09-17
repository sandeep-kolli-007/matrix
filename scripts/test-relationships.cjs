const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/data/entity-relations.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject });
const { relationshipIndex } = exportsObject;
assert.equal(relationshipIndex([]).size, 0);
const items = [
  { id: 'a', relatedIds: ['a', 'b', 'b', 'missing', 'archived'] },
  { id: 'b', relatedIds: ['a'] },
  { id: 'c', relatedIds: ['b'] },
  { id: 'isolated' },
  { id: 'archived', archivedAt: '2026-09-08', relatedIds: ['a'] },
];
const index = relationshipIndex(items);
assert.deepEqual([...index.get('a')], ['b']);
assert.deepEqual([...index.get('b')], ['a', 'c']);
assert.deepEqual([...index.get('c')], ['b']);
assert.equal(index.get('isolated').size, 0);
assert.equal(index.has('archived'), false);
assert.equal([...index.values()].reduce((sum, ids) => sum + ids.size, 0) / 2, 2);
const large = Array.from({ length: 2145 }, (_, i) => ({ id: String(i), relatedIds: i ? [String(i - 1)] : [] }));
const largeIndex = relationshipIndex(large);
assert.equal(largeIndex.size, 2145);
assert.equal([...largeIndex.values()].reduce((sum, ids) => sum + ids.size, 0) / 2, 2144);
console.log('PASS: empty, incoming, duplicate, self, missing, archived, isolated, and 2,145-record relationship indexes.');
