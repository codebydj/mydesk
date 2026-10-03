import type { Store, Task, InboxItem, Note, Project, Subject } from './types';
import { id, now } from './store';
export type Group = 'tasks' | 'projects' | 'notes' | 'inbox' | 'subjects';
export type Item = Task | InboxItem | Note | Project | Subject;
export function lifecycleRecord(item: Item, group: Group, action: 'archive' | 'trash' | 'restore'): Item {
  if (group === 'tasks') {
    const task = item as Task;
    return { ...task, previousStatus: task.status === 'open' || task.status === 'completed' ? task.status : task.previousStatus, status: action === 'restore' ? task.previousStatus || 'open' : action === 'archive' ? 'archived' : 'trash', deletedAt: action === 'trash' ? now() : undefined, updatedAt: now() };
  }
  return { ...item, archived: action === 'archive', deletedAt: action === 'trash' ? now() : undefined, updatedAt: now() };
}
export function convertInbox(s: Store, sourceId: string): Store {
  const source = s.inbox.find(x => x.id === sourceId);
  if (!source || source.convertedTaskId || source.archived || source.deletedAt || s.tasks.some(t => t.sourceInboxId === sourceId)) return s;
  const t: Task = { id: id(), title: source.content.split('\n').find(line => line.trim())?.trim() || 'Inbox task', description: source.content, priority: 'medium', tags: [], subtasks: [], status: 'open', createdAt: now(), updatedAt: now(), sourceInboxId: sourceId };
  return { ...s, tasks: [t, ...s.tasks], inbox: s.inbox.map(x => x.id === sourceId ? { ...x, convertedTaskId: t.id } : x) };
}
export function finishFocus(s: Store, time = Date.now()): Store {
  const f = s.focusState;
  if (!f?.endsAt || f.endsAt > time) return s;
  const sessionId = f.id || id();
  return { ...s, focusState: undefined, focus: s.focus.some(x => x.id === sessionId) ? s.focus : [...s.focus, { id: sessionId, taskId: f.taskId, startedAt: f.startedAt || new Date(f.endsAt - 1500000).toISOString(), endedAt: new Date(f.endsAt).toISOString(), minutes: (f.duration || 1500) / 60 }] };
}
