import type { LifeEntity } from './lifeos-store';

export function monthCells(day: string): (string | null)[] {
  const first = new Date(`${day.slice(0, 7)}-01T12:00:00Z`);
  if (!Number.isFinite(first.getTime())) return [];
  const offset = (first.getUTCDay() + 6) % 7;
  const last = new Date(first); last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let n = 1; n <= last.getUTCDate(); n++) cells.push(`${day.slice(0, 7)}-${String(n).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function creationDateFields(type: string, day?: string): Record<string, string> {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return {};
  const date = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return {};
  const key = ({ Task: 'due', Event: 'date', Reminder: 'date', Trip: 'start' } as Record<string, string>)[type];
  return key ? { [key]: day } : {};
}

export function scheduledDate(item: LifeEntity): string | null {
  if (item.archivedAt || !['task', 'event', 'meeting', 'appointment', 'trip', 'reminder', 'reservation', 'goal', 'milestone', 'bill'].includes(item.kind)) return null;
  const candidates = item.kind === 'trip' ? [item.metadata.start, item.metadata.start_date, item.metadata.date] : [item.metadata.due, item.metadata.deadline, item.metadata.date, item.metadata.start];
  const value = candidates.find((candidate) => typeof candidate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(candidate));
  if (typeof value !== 'string') return null;
  const date = value.slice(0, 10);
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

/** Calendar-only comparison; recurrence never creates or changes stored records. */
export function occursOn(item: LifeEntity, day: string): boolean {
  const start = scheduledDate(item);
  const current = new Date(`${day}T12:00:00Z`);
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(current.getTime()) || current.toISOString().slice(0, 10) !== day || day < start) return false;
  if (item.kind === 'trip') {
    const rawEnd = String(item.metadata.end || item.metadata.end_date || start).slice(0, 10);
    const end = new Date(`${rawEnd}T12:00:00Z`);
    const validEnd = Number.isFinite(end.getTime()) && end.toISOString().slice(0, 10) === rawEnd && rawEnd >= start;
    return day <= (validEnd ? rawEnd : start);
  }
  if (day === start) return true;
  if (item.kind !== 'reminder') return false;
  const repeat = String(item.metadata.repeat || '').toLowerCase();
  const anchor = new Date(`${start}T12:00:00Z`);
  if (repeat === 'daily') return true;
  if (repeat === 'weekly') return current.getUTCDay() === anchor.getUTCDay();
  // Missing calendar dates are skipped, not silently moved to a different day.
  if (repeat === 'monthly') return day.slice(8) === start.slice(8);
  if (repeat === 'yearly') return day.slice(5) === start.slice(5);
  return false;
}
