import type { LifeEntity } from './lifeos-store';

/** Undirected visible links: omit missing/archived records and collapse duplicate edges. */
export function relationshipIndex(all: LifeEntity[]) {
  const visible = all.filter((item) => !item.archivedAt);
  const index = new Map(visible.map((item) => [item.id, new Set<string>()]));
  for (const item of visible) {
    for (const id of item.relatedIds ?? []) {
      if (id === item.id || !index.has(id)) continue;
      index.get(item.id)!.add(id);
      index.get(id)!.add(item.id);
    }
  }
  return index;
}

export function relatedEntities(entity: LifeEntity, all: LifeEntity[]): LifeEntity[] {
  return all.filter((item) => item.id !== entity.id && (
    entity.relatedIds?.includes(item.id) || item.relatedIds?.includes(entity.id)
  ));
}
