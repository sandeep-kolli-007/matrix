import type { LifeEntity } from './lifeos-store';

const eligible = new Set(['project', 'trip', 'plan', 'event', 'meeting', 'goal', 'financial-goal', 'milestone', 'routine', 'challenge', 'course', 'list', 'itinerary', 'packing-list', 'reservation']);
export function taskProjectOptions(records: LifeEntity[], taskId?: string): LifeEntity[] {
  return records.filter(record => {
    const type = String(record.metadata.entityType ?? record.kind).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return record.id !== taskId && !record.archivedAt && eligible.has(type);
  }).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function selectTaskProject(values: Record<string, string>, relatedIds: string[], entity?: LifeEntity, field: 'project' | 'goal' = 'project') {
  return {
    values: { ...values, [field + 'Id']: entity?.id ?? '', [field]: entity?.title ?? '' },
    relatedIds: [...new Set([...relatedIds.filter(id => id !== values[field + 'Id']), ...(entity ? [entity.id] : [])])],
  };
}
