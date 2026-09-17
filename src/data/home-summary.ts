import type { LifeEntity } from './lifeos-store';
import { occursOn, scheduledDate } from './planning';

export function homeSummary(items: LifeEntity[], day: string) {
  const visible = items.filter(item => !item.archivedAt);
  const tasks = visible.filter(item => item.kind === 'task');
  const completed = tasks.filter(item => item.metadata.completed === true).length;
  const active = visible.filter(item => item.metadata.completed !== true);
  const overdue = active.filter(item => ['task', 'bill', 'goal', 'milestone'].includes(item.kind) && (scheduledDate(item) ?? day) < day);
  const urgentIds = new Set(overdue.map(item => item.id));
  for (const item of active) if (String(item.metadata.priority).toLowerCase() === 'high') urgentIds.add(item.id);
  const today = active.filter(item => occursOn(item, day));
  return { tasks, completed, active, overdue, urgentIds, today,
    progress: tasks.length ? Math.round(completed / tasks.length * 100) : null };
}
