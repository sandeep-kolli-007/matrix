import type { LifeEntity } from './lifeos-store';
export function localDay(date: Date): string {
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + offset); return localDay(date);
}
export function timelineRecords(items: LifeEntity[], day: string) {
  return items.filter(item => !item.archivedAt && localDay(new Date(item.createdAt)) === day).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}
