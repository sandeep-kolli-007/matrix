import AsyncStorage from '@react-native-async-storage/async-storage';

// The catalog is intentionally open-ended. Keeping the stored kind as a string
// lets new MATRIX entity templates ship without a storage migration.
export type LifeEntityKind = string;

export type LifeEntity = {
  id: string;
  kind: LifeEntityKind;
  title: string;
  details?: string;
  deviceOnly: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  relatedIds?: string[];
  source?: 'supabase' | 'preview';
  metadata: Record<string, string | number | boolean | null>;
};

const ENTITY_KEY = 'lifeos:entities:v1';
let pendingWrite: Promise<unknown> = Promise.resolve();
let externalReader: (() => Promise<LifeEntity[]>) | null = null;
let replaceLocal = false;
export function setEntitySource(reader: (() => Promise<LifeEntity[]>) | null, replace = false) {
  externalReader = reader;
  replaceLocal = replace;
}

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => undefined);
  return result;
}

function isEntity(value: unknown): value is LifeEntity {
  if (!value || typeof value !== 'object') return false;
  const entity = value as Partial<LifeEntity>;
  return typeof entity.id === 'string' && typeof entity.kind === 'string'
    && typeof entity.title === 'string' && typeof entity.deviceOnly === 'boolean'
    && typeof entity.createdAt === 'string' && typeof entity.updatedAt === 'string'
    && !!entity.metadata && typeof entity.metadata === 'object' && !Array.isArray(entity.metadata)
    && (entity.relatedIds === undefined || (Array.isArray(entity.relatedIds) && entity.relatedIds.every((id) => typeof id === 'string')));
}

async function readEntities(): Promise<LifeEntity[]> {
  const raw = await AsyncStorage.getItem(ENTITY_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isEntity)) {
    throw new Error('Your saved data could not be read. It has been preserved on this device.');
  }
  return parsed;
}

export async function listEntities() {
  await pendingWrite;
  const local = replaceLocal ? [] : await readEntities();
  const remote = externalReader ? await externalReader() : [];
  const remoteIds = new Set(remote.map((item) => item.id));
  return [...remote, ...local.filter((item) => !remoteIds.has(item.id))].filter((item) => !item.archivedAt);
}

export async function listArchivedEntities(): Promise<LifeEntity[]> {
  await pendingWrite;
  return (await readEntities()).filter((item) => !!item.archivedAt).sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));
}

export function setEntityArchived(id: string, archived: boolean) {
  return serializeWrite(async () => {
    const entities = await readEntities();
    const item = entities.find((entity) => entity.id === id);
    if (!item || item.source) throw new Error('Only saved local items can be archived or restored.');
    const now = new Date().toISOString();
    await AsyncStorage.setItem(ENTITY_KEY, JSON.stringify(entities.map((entity) => entity.id === id ? { ...entity, archivedAt: archived ? now : undefined, updatedAt: now } : entity)));
  });
}

export async function saveEntity(entity: Omit<LifeEntity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  return serializeWrite(async () => {
  if (entity.source) throw new Error('This connected record is read-only in this preview.');
  if (!entity.title.trim()) throw new Error('Enter a name before saving.');
  const entities = await readEntities();
  const now = new Date().toISOString();
  const existing = entity.id ? entities.find((item) => item.id === entity.id) : undefined;
  const relatedIds = [...new Set(entity.relatedIds ?? [])];
  if (relatedIds.some((id) => id === entity.id || !entities.some((item) => item.id === id))) {
    throw new Error('A related item no longer exists. Choose the relationship again.');
  }
  const saved: LifeEntity = {
    ...entity,
    archivedAt: existing?.archivedAt,
    relatedIds,
    id: entity.id ?? `${entity.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = existing ? entities.map((item) => item.id === saved.id ? saved : item) : [saved, ...entities];
  await AsyncStorage.setItem(ENTITY_KEY, JSON.stringify(next));
  return saved;
  });
}

export async function removeEntity(id: string) {
  return serializeWrite(async () => {
  const entities = await readEntities();
  await AsyncStorage.setItem(ENTITY_KEY, JSON.stringify(entities.filter((entity) => entity.id !== id).map((entity) => ({
    ...entity, relatedIds: entity.relatedIds?.filter((relatedId) => relatedId !== id),
  }))));
  });
}
