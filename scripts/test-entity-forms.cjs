const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const exports = cache[name] = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/data', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (value) => load(value.replace('./', '')), Date, URL });
  return exports;
}
const { validateEntityInput: validate } = load('entity-validation');
const { localDay, shiftDay, timelineRecords } = load('timeline');
const timelineDay = localDay(new Date(2026, 8, 9, 10));
assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
assert.equal(shiftDay('2028-03-01', -1), '2028-02-29');
const timelineItem = { id: 'a', createdAt: new Date(2026, 8, 9, 10).toISOString(), updatedAt: new Date(2026, 8, 10, 10).toISOString(), metadata: { date: '2026-09-11' } };
assert.equal(timelineRecords([timelineItem], timelineDay).length, 1);
assert.equal(timelineRecords([timelineItem], '2026-09-10').length, 0);
assert.equal(timelineRecords([{ ...timelineItem, archivedAt: '2026-09-12' }], timelineDay).length, 0);
assert.equal(timelineRecords([{ ...timelineItem, createdAt: 'invalid' }], timelineDay).length, 0);
const { entityFields, fieldsForEntity } = load('entity-fields');
const { selectedWeekdays, toggleWeekday } = load('weekly-schedule');
assert.equal(selectedWeekdays('Daily').length, 7);
assert.equal(selectedWeekdays('Weekdays').length, 5);
assert.deepEqual(Array.from(selectedWeekdays('Weekends')), ['Sat', 'Sun']);
assert.deepEqual(Array.from(selectedWeekdays('Fri, Mon, Fri')), ['Mon', 'Fri']);
assert.equal(selectedWeekdays('Every 4 weeks').length, 0);
assert.equal(toggleWeekday('', 'Wed'), 'Wed');
assert.equal(toggleWeekday('Wed', 'Wed'), '');
assert.equal(toggleWeekday('Daily', 'Sun'), 'Mon, Tue, Wed, Thu, Fri, Sat');
assert.equal(toggleWeekday('Mon, Tue, Wed, Thu, Fri, Sat', 'Sun'), 'Daily');
assert.equal(toggleWeekday('Every 4 weeks', 'Mon'), 'Mon');
assert.equal(toggleWeekday('Weekdays', 'Invalid'), 'Weekdays');
assert.equal(fieldsForEntity('Habit').find(field => field.key === 'frequency').weeklySchedule, true);
assert.equal(fieldsForEntity('Routine').find(field => field.key === 'frequency').weeklySchedule, true);
assert.equal(fieldsForEntity('Grooming').find(field => field.key === 'frequency').weeklySchedule, undefined);
assert.equal(fieldsForEntity('Cycle Log').find(field => field.key === 'date').input, 'date');
assert.equal(validate('Cycle Log', 'Log', { date: '2028-02-29', cycleDay: '1' }), null);
assert.equal(validate('Cycle Log', 'Log', { cycleDay: '' }), null);
for (const cycleDay of ['0', '-1', '1.5', '9007199254740992']) {
  assert.ok(validate('Cycle Log', 'Log', { cycleDay }), `Reject invalid cycle day ${cycleDay}`);
}
assert.ok(validate('Cycle Log', 'Log', { date: '2026-02-29' }));
const { scheduledDate } = load('planning');
const { occursOn } = load('planning');
const { monthCells, creationDateFields } = load('planning');
assert.equal(monthCells('2028-02-01').filter(Boolean).length, 29);
assert.equal(monthCells('2027-02-01').filter(Boolean).length, 28);
assert.equal(monthCells('2026-09-01')[0], null);
assert.equal(monthCells('2026-09-01')[1], '2026-09-01');
assert.equal(monthCells('2026-09-01').length % 7, 0);
assert.equal(creationDateFields('Task', '2026-09-10').due, '2026-09-10');
assert.equal(creationDateFields('Event', '2026-09-10').date, '2026-09-10');
assert.equal(creationDateFields('Reminder', '2026-09-10').date, '2026-09-10');
assert.equal(creationDateFields('Trip', '2026-09-10').start, '2026-09-10');
assert.equal(Object.keys(creationDateFields('Task', '2026-02-30')).length, 0);
assert.equal(Object.keys(creationDateFields('Note', '2026-09-10')).length, 0);
const recurring = (repeat, date = '2026-01-31') => ({ kind: 'reminder', metadata: { repeat, date } });
assert.equal(occursOn(recurring('Daily'), '2026-02-01'), true);
assert.equal(occursOn(recurring('Daily'), '2026-01-30'), false);
assert.equal(occursOn(recurring('Weekly'), '2026-02-07'), true);
assert.equal(occursOn(recurring('Weekly'), '2026-02-08'), false);
assert.equal(occursOn(recurring('Monthly'), '2026-02-28'), false);
assert.equal(occursOn(recurring('Monthly'), '2026-03-31'), true);
assert.equal(occursOn(recurring('Yearly', '2024-02-29'), '2028-02-29'), true);
assert.equal(occursOn(recurring('Yearly', '2024-02-29'), '2027-02-28'), false);
assert.equal(occursOn(recurring('Never'), '2026-02-01'), false);
assert.equal(occursOn(recurring('Daily'), '2026-02-30'), false);
assert.equal(occursOn({ ...recurring('Daily'), archivedAt: '2026-01-31' }, '2026-02-01'), false);
const trip = { kind: 'trip', metadata: { start: '2026-09-01', end: '2026-09-04', date: '2020-01-01' } };
assert.equal(scheduledDate(trip), '2026-09-01');
assert.equal(occursOn(trip, '2026-09-03'), true);
assert.equal(occursOn(trip, '2026-09-04'), true);
assert.equal(occursOn(trip, '2026-09-05'), false);
assert.equal(occursOn({ ...trip, metadata: { start: '2026-09-01', end: 'invalid' } }, '2026-09-02'), false);
assert.equal(scheduledDate({ kind: 'task', metadata: { due: '2028-02-29' } }), '2028-02-29');
assert.equal(scheduledDate({ kind: 'task', metadata: { due: '2027-02-29' } }), null);
assert.equal(scheduledDate({ kind: 'task', archivedAt: '2026-09-08', metadata: { due: '2026-09-08' } }), null);
assert.equal(scheduledDate({ kind: 'journal', metadata: { date: '2026-09-08' } }), null);
assert.equal(scheduledDate({ kind: 'meeting', metadata: { date: '2026-09-08T12:00:00Z' } }), '2026-09-08');
const { pickerDate, formatLocalDate, formatLocalTime } = load('entity-date');
for (const timezone of ['Asia/Kolkata', 'America/Los_Angeles', 'Pacific/Auckland', 'UTC']) {
  process.env.TZ = timezone;
  for (const value of ['2028-02-29', '2026-03-08', '2026-11-01', '1990-12-31']) assert.equal(formatLocalDate(pickerDate(value, 'date')), value);
  for (const value of ['00:00', '09:30', '23:59']) assert.equal(formatLocalTime(pickerDate(value, 'time')), value);
  const fallback = new Date(2026, 8, 7, 12, 0);
  assert.equal(pickerDate('2027-02-29', 'date', fallback).getTime(), fallback.getTime());
  assert.equal(pickerDate('25:00', 'time', fallback).getTime(), fallback.getTime());
}
assert.equal(Object.keys(entityFields).length, 73);
assert.equal(load('entity-catalog').entityCatalog.length, 73);
const { logTotals, readLogItems } = load('log-items');
const foods = [{ name: 'Oats', calories: '152', protein: '5', carbs: '27', fat: '3' }, { name: 'Banana', calories: '105', protein: '1', carbs: '25', fat: '0' }];
assert.equal(logTotals('Meal', foods).calories, 257);
assert.equal(logTotals('Meal', foods).protein, 6);
assert.equal(logTotals('Meal', []).calories, null);
assert.equal(logTotals('Meal', [...foods, { name: 'Unknown food' }]).calories, null);
assert.equal(logTotals('Workout', [{ name: 'Press', sets: '4', reps: '8', weight: '80' }]).volume, 2560);
assert.equal(readLogItems('broken').length, 0);
assert.equal(validate('Meal', 'Breakfast', { logItems: JSON.stringify(foods) }), null);
assert.ok(validate('Meal', 'Breakfast', { logItems: JSON.stringify([{ name: '' }]) }));
assert.ok(validate('Meal', 'Breakfast', { logItems: JSON.stringify([{ name: 'Oats', calories: '-1' }]) }));
assert.ok(validate('Workout', 'Gym', { logItems: JSON.stringify([{ name: 'Press', sets: '1.5' }]) }));
assert.equal(validate('Wardrobe Log', 'Office outfit', { logItems: JSON.stringify([{ name: 'Black T-shirt', slot: 'Top' }]) }), null);
for (const name of Object.keys(entityFields)) {
  assert.equal(validate(name, 'Sample', {}), null, name);
  assert.ok(validate(name, ' ', {}), name);
  for (const field of fieldsForEntity(name)) {
    if (field.input === 'date') {
      assert.equal(validate(name, 'Sample', { [field.key]: '2028-02-29' }), null);
      assert.ok(validate(name, 'Sample', { [field.key]: '2027-02-29' }));
      assert.ok(validate(name, 'Sample', { [field.key]: '2026-04-31' }));
      assert.ok(validate(name, 'Sample', { [field.key]: 'tomorrow' }));
    }
    if (field.input === 'time') {
      assert.equal(validate(name, 'Sample', { [field.key]: '23:59' }), null);
      assert.ok(validate(name, 'Sample', { [field.key]: '24:00' }));
      assert.ok(validate(name, 'Sample', { [field.key]: '12:60' }));
    }
  }
}
assert.ok(validate('Trip', 'Trip', { start: '2026-10-10', end: '2026-10-09' }));
assert.equal(validate('Trip', 'Trip', { start: '2026-10-10', end: '2026-10-10' }), null);
assert.ok(validate('Book', 'Book', { progress: '101' }));
assert.equal(validate('Book', 'Book', { progress: '100' }), null);
assert.ok(validate('Movie', 'Movie', { rating: '11' }));
assert.equal(validate('Expense', 'Expense', { amount: '0' }), null);
assert.ok(validate('Expense', 'Expense', { amount: '₹100' }));
console.log('PASS: all 73 form schemas, log totals and validation, calendar/time validation, trip ordering, numeric boundaries and required titles.');
