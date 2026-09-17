export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** Unknown legacy free text is not interpreted as a schedule. */
export function selectedWeekdays(value: string): string[] {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'daily') return [...weekdays];
  if (normalized === 'weekdays') return weekdays.slice(0, 5);
  if (normalized === 'weekends') return weekdays.slice(5);
  if (!normalized) return [];
  const parts = normalized.split(',').map(part => part.trim());
  if (parts.some(part => !weekdays.some(day => day.toLowerCase() === part))) return [];
  return weekdays.filter(day => parts.includes(day.toLowerCase()));
}

export function toggleWeekday(value: string, day: string): string {
  if (!weekdays.some(candidate => candidate === day)) return value;
  const selected = new Set(selectedWeekdays(value));
  if (selected.has(day)) selected.delete(day); else selected.add(day);
  const days = weekdays.filter(candidate => selected.has(candidate));
  return days.length === 7 ? 'Daily' : days.join(', ');
}
