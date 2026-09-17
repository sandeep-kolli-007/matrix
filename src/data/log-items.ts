export type LogItem = Record<string, string>;
export const specializedLogTypes = ['Meal', 'Workout', 'Wardrobe Log', 'Mood Log'];
export function readLogItems(value: unknown): LogItem[] {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item =>
      Object.fromEntries(Object.entries(item).filter(([, v]) => typeof v === 'string')) as LogItem);
  } catch { return []; }
}
export type WorkoutSet = { weight: string; reps: string };
export function readWorkoutSets(item: LogItem): WorkoutSet[] {
  if (item.setEntries !== undefined) {
    try {
      const rows = JSON.parse(item.setEntries);
      return Array.isArray(rows) ? rows.filter(row => row && typeof row.weight === 'string' && typeof row.reps === 'string').map(row => ({ weight: row.weight, reps: row.reps })) : [];
    } catch { return []; }
  }
  const count = Number(item.sets);
  // Legacy aggregate records remain unchanged until edited.
  return Number.isSafeInteger(count) && count > 0 && count <= 1000
    ? Array.from({ length: count }, () => ({ weight: item.weight ?? '', reps: item.reps ?? '' })) : [];
}
export function withWorkoutSets(item: LogItem, rows: WorkoutSet[]): LogItem {
  const { sets, reps, weight, ...rest } = item;
  return { ...rest, setEntries: JSON.stringify(rows) };
}
function workoutVolume(item: LogItem): number | null {
  if (item.setEntries === undefined) return ['sets', 'reps', 'weight'].every(k => item[k]?.trim() && Number.isFinite(Number(item[k]))) ? Number(item.sets) * Number(item.reps) * Number(item.weight) : null;
  const rows = readWorkoutSets(item);
  return rows.length && rows.every(row => row.weight.trim() && row.reps.trim() && Number.isFinite(Number(row.weight)) && Number.isFinite(Number(row.reps)))
    ? rows.reduce((sum, row) => sum + Number(row.weight) * Number(row.reps), 0) : null;
}
export function logTotals(type: string, items: LogItem[]): Record<string, number | null> {
  const keys = type === 'Meal' ? ['calories', 'protein', 'carbs', 'fat'] : ['volume'];
  return Object.fromEntries(keys.map(key => {
    const values = items.map(item => key === 'volume'
      ? workoutVolume(item)
      : (item[key]?.trim() && Number.isFinite(Number(item[key])) ? Number(item[key]) : null));
    return [key, values.length && values.every(v => v !== null) ? values.reduce<number>((sum, v) => sum + (v ?? 0), 0) : null];
  }));
}
export function validateLogItems(type: string, raw: string | undefined): string | null {
  if (!raw) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return 'The log items could not be read. Please edit them again.'; }
  if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item !== 'object' || Array.isArray(item))) return 'Invalid log items.';
  const items = readLogItems(raw);
  for (const [index, item] of items.entries()) {
    if (type === 'Workout' && Object.prototype.hasOwnProperty.call(parsed[index], 'setEntries')) {
      let rows: unknown;
      try { rows = JSON.parse(item.setEntries); } catch { return `Item ${index + 1}: invalid sets.`; }
      if (!Array.isArray(rows) || !rows.length) return `Item ${index + 1}: add at least one set or remove the exercise.`;
      for (const [setIndex, row] of rows.entries()) {
        if (!row || typeof row.weight !== 'string' || typeof row.reps !== 'string') return `Item ${index + 1}: invalid set ${setIndex + 1}.`;
        if (!/^\d+(\.\d+)?$/.test(row.weight) || !Number.isFinite(Number(row.weight))) return `Item ${index + 1}, set ${setIndex + 1}: enter a non-negative weight (0 for bodyweight).`;
        if (!/^\d+$/.test(row.reps) || !Number.isSafeInteger(Number(row.reps)) || Number(row.reps) < 1) return `Item ${index + 1}, set ${setIndex + 1}: enter whole reps greater than zero.`;
      }
    }
    if (!item.name?.trim()) return `Add a name for item ${index + 1}, or remove it.`;
    for (const key of type === 'Meal' ? ['calories', 'protein', 'carbs', 'fat'] : type === 'Workout' ? ['sets', 'reps', 'weight'] : []) {
      if (item[key]?.trim() && (!/^\d+(\.\d+)?$/.test(item[key]) || !Number.isFinite(Number(item[key])))) return `Item ${index + 1}: ${key} must be a non-negative number.`;
      if (['sets', 'reps'].includes(key) && item[key]?.trim() && !Number.isSafeInteger(Number(item[key]))) return `Item ${index + 1}: ${key} must be a whole number.`;
    }
  }
  return null;
}
