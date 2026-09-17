import type { LifeEntity } from './lifeos-store';
export type MessageThread = { id: string; title: string; preview: string; group: boolean; unread: boolean; source?: LifeEntity['source']; recordId?: string; updatedAt: string; messages: LifeEntity[] };
export function messageThreads(items: LifeEntity[]): MessageThread[] {
  const threads = new Map<string, MessageThread>();
  for (const item of items) {
    if (item.archivedAt || item.kind !== 'conversation' || item.metadata.subtype === 'call_log') continue;
    threads.set(item.id, { id: item.id, title: item.title, preview: item.details ?? '', group: item.metadata.subtype === 'group_thread', unread: item.metadata.unread === true || Number(item.metadata.unread) > 0, source: item.source, recordId: item.id, updatedAt: item.updatedAt, messages: [] });
  }
  for (const item of [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (item.archivedAt || item.kind !== 'message') continue;
    const id = String(item.metadata.threadId || item.id);
    let thread = threads.get(id);
    if (!thread) {
      thread = { id, title: String(item.metadata.recipient || item.metadata.to || item.title), preview: '', group: false, unread: false, source: item.source, updatedAt: item.updatedAt, messages: [] };
      threads.set(id, thread);
    }
    thread.messages.push(item);
    thread.preview = item.details ?? item.title;
    if (item.updatedAt > thread.updatedAt) thread.updatedAt = item.updatedAt;
  }
  return [...threads.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
