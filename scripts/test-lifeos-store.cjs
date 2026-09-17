const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

// Exercise the real store with an asynchronous storage adapter. No user data is read.
const source = ts.transpileModule(readFileSync(resolve(__dirname, '../src/data/lifeos-store.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const disk = new Map();
let failNextWrite = false;
const adapter = {
  async getItem(key) { await new Promise((resolve) => setTimeout(resolve, 1)); return disk.get(key) ?? null; },
  async setItem(key, value) {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (failNextWrite) { failNextWrite = false; throw new Error('Disk unavailable'); }
    disk.set(key, value);
  },
};
function loadStore() {
  const exports = {};
  runInNewContext(source, { exports, require: () => adapter, Date, Math, Promise, Error });
  return exports;
}
const input = (title) => ({ kind: 'task', title, deviceOnly: true, metadata: { priority: 'High' } });

(async () => {
  let store = loadStore();
  await Promise.all(Array.from({ length: 50 }, (_, index) => store.saveEntity(input(`Task ${index}`))));
  let items = await store.listEntities();
  assert.equal(items.length, 50, 'Concurrent saves must preserve every record');
  assert.equal(new Set(items.map((item) => item.id)).size, 50, 'IDs must be unique');
  store = loadStore();
  items = await store.listEntities();
  assert.equal(items.length, 50, 'Records must survive store recreation');
  const original = items[0];
  await store.saveEntity({ ...original, title: 'Edited', deviceOnly: false });
  const edited = (await store.listEntities()).find((item) => item.id === original.id);
  assert.equal(edited.title, 'Edited');
  assert.equal(edited.deviceOnly, false);
  assert.equal(edited.createdAt, original.createdAt);
  assert.equal((await store.listEntities()).length, 50, 'Edit must not duplicate');
  failNextWrite = true;
  await assert.rejects(store.saveEntity(input('Failed save')));
  await store.saveEntity(input('Recovered save'));
  assert.equal((await store.listEntities()).length, 51, 'Failure must not poison later saves');
  await store.removeEntity(original.id);
  assert.equal((await store.listEntities()).length, 50);
  await assert.rejects(store.saveEntity(input('   ')));
  const goal = await store.saveEntity({ ...input('Goal'), kind: 'goal' });
  const task = await store.saveEntity({ ...input('Linked task'), relatedIds: [goal.id, goal.id] });
  assert.equal(task.relatedIds.length, 1, 'Duplicate relationships are collapsed');
  assert.equal((await loadStore().listEntities()).find((item) => item.id === task.id).relatedIds[0], goal.id, 'Relationship survives reload');
  await assert.rejects(store.saveEntity({ ...task, relatedIds: [task.id] }), /related item/);
  await assert.rejects(store.saveEntity({ ...task, relatedIds: ['missing'] }), /related item/);
  await store.setEntityArchived(goal.id, true);
  assert.equal((await store.listEntities()).some((item) => item.id === goal.id), false, 'Archived items leave active views');
  const archived = (await loadStore().listArchivedEntities()).find((item) => item.id === goal.id);
  assert.ok(archived.archivedAt, 'Archive survives reload');
  assert.equal(archived.deviceOnly, goal.deviceOnly, 'Archive preserves privacy');
  assert.equal((await store.listEntities()).find((item) => item.id === task.id).relatedIds[0], goal.id, 'Archive preserves relationships');
  failNextWrite = true;
  await assert.rejects(store.setEntityArchived(goal.id, false));
  assert.equal((await store.listArchivedEntities()).length, 1, 'Failed restore preserves archive');
  await store.setEntityArchived(goal.id, false);
  assert.equal((await store.listArchivedEntities()).length, 0);
  assert.equal((await store.listEntities()).find((item) => item.id === goal.id).title, goal.title, 'Restore preserves details');
  await assert.rejects(store.setEntityArchived('missing', true));
  await store.removeEntity(goal.id);
  assert.equal((await store.listEntities()).find((item) => item.id === task.id).relatedIds.length, 0, 'Deletion removes dangling references');
  for (const kind of ['meal', 'workout', 'wardrobe-log']) {
    const logItems = JSON.stringify([{ name: 'QA item', sets: '4', reps: '8', weight: '20', calories: '100', slot: 'Top' }]);
    const log = await store.saveEntity({ kind, title: `QA ${kind}`, deviceOnly: true, metadata: { logItems } });
    const reopened = (await loadStore().listEntities()).find(item => item.id === log.id);
    assert.equal(reopened.metadata.logItems, logItems);
    assert.equal(reopened.deviceOnly, true);
    await store.saveEntity({ ...reopened, metadata: { ...reopened.metadata, logItems: '[]' } });
    assert.equal((await loadStore().listEntities()).find(item => item.id === log.id).metadata.logItems, '[]');
  }
  for (const corrupt of ['{broken', '{}', '[{"id":"bad"}]']) {
    disk.set('lifeos:entities:v1', corrupt);
    await assert.rejects(store.saveEntity(input('Must not overwrite')));
    assert.equal(disk.get('lifeos:entities:v1'), corrupt, 'Corrupt data must be preserved');
  }
  console.log('PASS: concurrent writes, unique IDs, reload, edit/privacy, failure recovery, deletion, and corrupt-data preservation.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
