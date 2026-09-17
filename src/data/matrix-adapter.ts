import { entityCatalog } from './entity-catalog';
import type { LifeEntity } from './lifeos-store';

export type MatrixRow = { id: string; entity_type: string; data: Record<string, unknown>; created_at: string; updated_at: string; deleted_at?: string | null };
const map: Record<string, string> = {
  'task:plain': 'Task', 'task:habit_instance': 'Habit', 'task:recurring_chore': 'Task', 'task:goal_checkpoint': 'Goal',
  'financial:transaction': 'Expense', 'financial:bill': 'Bill', 'financial:subscription': 'Subscription', 'financial:budget': 'Budget', 'financial:debt': 'Loan',
  'health_log:workout': 'Workout', 'health_log:meal': 'Meal', 'health_log:sleep': 'Sleep Log', 'health_log:mood': 'Mood Log', 'health_log:symptom': 'Symptom', 'health_log:medication_log': 'Medication',
  'person:contact': 'Person', 'person:group': 'Group', 'person:organization': 'Person',
  'event:meeting': 'Meeting', 'event:appointment': 'Appointment', 'event:celebration': 'Event', 'event:trip_leg': 'Event', 'event:visit': 'Event',
  'place:trip': 'Trip', 'place:location': 'Place', 'place:visit': 'Place',
  'asset:vehicle': 'Vehicle', 'asset:property': 'Property', 'asset:electronics': 'Asset', 'asset:furniture': 'Asset',
  'document:note': 'Note', 'document:insurance_policy': 'Insurance',
  'learning:course': 'Course', 'learning:skill': 'Skill', 'learning:certification': 'Document',
  'journal_idea:journal_entry': 'Journal', 'journal_idea:idea': 'Idea', 'journal_idea:voice_memo': 'Note',
  'content:article': 'Article', 'content:link': 'Bookmark', 'content:podcast_episode': 'Podcast', 'content:highlight': 'Quote',
};
const fallback: Record<string, string> = { reminder: 'Reminder', document: 'Document', communication: 'Conversation', wishlist_item: 'Wish', insight: 'Insight', automation: 'Workflow', connector: 'Connector', health_log: 'Health Log' };
const scalar = (value: unknown): string => typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);
export function normalizeTimestamp(value: string): string {
  return value.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1').replace(/([+-]\d{2})$/, '$1:00');
}
export function normalizeMatrixRow(row: MatrixRow, source: 'supabase' | 'preview' = 'supabase'): LifeEntity | null {
  if (row.deleted_at) return null;
  const data = row.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data : {};
  const name = map[`${row.entity_type}:${data.subtype ?? ''}`] ?? fallback[row.entity_type] ?? row.entity_type;
  const definition = entityCatalog.find((item) => item.name === name);
  const metadata: LifeEntity['metadata'] = {};
  for (const [key, value] of Object.entries(data)) metadata[key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null ? value : JSON.stringify(value);
  const start = scalar(data.start_time ?? data.trigger_time ?? data.logged_at ?? data.taken_at);
  const due = scalar(data.due_date ?? data.target_date);
  Object.assign(metadata, {
    entityType: name, group: definition?.group ?? (row.entity_type === 'health_log' ? 'Health' : 'System'),
    originalType: row.entity_type, subtype: scalar(data.subtype),
    completed: data.status === 'completed' || data.status === 'done' || !!data.completed_at,
    date: scalar(data.date) || start.slice(0, 10) || due.slice(0, 10),
    due: due.slice(0, 10), start: scalar(data.start_date) || start,
    time: start && !Number.isNaN(Date.parse(start)) ? new Date(start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    duration: scalar(data.duration_min), progress: scalar(data.progress_pct),
  });
  return {
    id: row.id, kind: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: scalar(data.title ?? data.name ?? data.provider ?? data.text ?? data.content) || `${name} · ${row.id.slice(0, 6)}`,
    details: scalar(data.description ?? data.text_excerpt ?? data.content ?? data.text ?? data.last_message_preview) || undefined,
    deviceOnly: data.deviceOnly === true || data.device_only === true,
    createdAt: normalizeTimestamp(row.created_at), updatedAt: normalizeTimestamp(row.updated_at), metadata, source,
  };
}
