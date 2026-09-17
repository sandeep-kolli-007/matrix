const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/data/log-items.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
const { readLogItems, readWorkoutSets, withWorkoutSets, logTotals, validateLogItems } = exportsObject;
const rows = [{ weight: '20', reps: '8' }, { weight: '22.5', reps: '8' }, { weight: '20', reps: '12' }];
const item = withWorkoutSets({ name: 'Bench press', muscle: 'Chest', sets: '3', reps: '10', weight: '15' }, rows);
assert.equal(item.sets, undefined);
assert.equal(validateLogItems('Workout', JSON.stringify([item])), null);
assert.equal(logTotals('Workout', [item]).volume, 580);
assert.equal(JSON.stringify(readWorkoutSets(readLogItems(JSON.stringify([item]))[0])), JSON.stringify(rows));
assert.equal(readWorkoutSets({ sets: '3', weight: '20', reps: '8' }).length, 3);
assert.equal(logTotals('Workout', [{ sets: '3', weight: '20', reps: '8' }]).volume, 480);
assert.equal(readWorkoutSets(withWorkoutSets(item, rows.slice(1))).length, 2);
assert.equal(readWorkoutSets(withWorkoutSets(item, Array.from({ length: 30 }, () => rows[0]))).length, 30);
for (const invalid of [[], [{ weight: '', reps: '8' }], [{ weight: '-1', reps: '8' }], [{ weight: '20', reps: '1.5' }], [{ weight: '20', reps: '0' }]]) {
  assert.ok(validateLogItems('Workout', JSON.stringify([withWorkoutSets(item, invalid)])));
}
assert.equal(validateLogItems('Workout', JSON.stringify([withWorkoutSets(item, [{ weight: '0', reps: '8' }])])), null);
assert.equal(logTotals('Workout', [withWorkoutSets(item, [{ weight: '', reps: '8' }])]).volume, null);
console.log('PASS: independent sets, 580 kg example, round trip, add/remove, legacy workouts, and validation.');
