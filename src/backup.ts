import type { Store } from './types';
import { migrate } from './store';
export const groups = ['tasks', 'projects', 'notes', 'inbox', 'subjects', 'focus'] as const;
export function safeUrl(value?: string) {
  if (!value) return undefined;
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password ? u.href : undefined; } catch { return undefined; }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown) => typeof v === 'string';
export function validateBackup(value: unknown): { version: 2; data: Store } {
  if (!object(value) || value.version !== 2 || !object(value.data)) throw Error('Unsupported MyDesk backup.');
  const data = value.data;
  if (![2, 3, 4].includes(Number(data.version))) throw Error('Unsupported workspace schema.');
  for (const group of groups) {
    const records = data[group];
    if (!Array.isArray(records)) throw Error('Missing record collection: ' + group);
    const ids = new Set();
    for (const r of records) {
      if (!object(r) || !text(r.id) || !r.id || ids.has(r.id)) throw Error('Invalid or duplicate ID in ' + group);
      ids.add(r.id);
      if (group !== 'focus' && (!text(r.createdAt) || !Number.isFinite(Date.parse(r.createdAt as string)))) throw Error('Invalid creation date.');
      for (const key of ['title', 'name', 'body', 'content', 'description', 'subject', 'subjectId', 'projectId', 'updatedAt', 'deletedAt', 'nextAction', 'github', 'website', 'url', 'color', 'sourceInboxId', 'convertedTaskId']) if (r[key] !== undefined && !text(r[key])) throw Error('Invalid text field: ' + key);
      for (const key of ['archived', 'pinned', 'isPriority']) if (r[key] !== undefined && typeof r[key] !== 'boolean') throw Error('Invalid flag.');
      if (group === 'tasks' || group === 'notes') {
        if (!text(r.title) || !Array.isArray(r.tags) || !r.tags.every(text)) throw Error('Invalid title or tags.');
      }
      if (group === 'tasks') {
        if (!['open', 'completed', 'archived', 'trash'].includes(r.status as string) || !['low', 'medium', 'high'].includes(r.priority as string)) throw Error('Invalid task status or priority.');
        if (!Array.isArray(r.subtasks) || r.subtasks.some(s => !object(s) || !text(s.id) || !text(s.title) || typeof s.done !== 'boolean')) throw Error('Invalid subtasks.');
        for (const key of ['dueDate', 'plannedDate']) if (r[key] && (!text(r[key]) || !/^\d{4}-\d{2}-\d{2}$/.test(r[key] as string) || !Number.isFinite(Date.parse(r[key] as string)))) throw Error('Invalid task date.');
      }
      if (group === 'notes' && (!text(r.body) || typeof r.pinned !== 'boolean' || !text(r.updatedAt) || !Number.isFinite(Date.parse(r.updatedAt as string)))) throw Error('Invalid note.');
      if (group === 'projects' && (!text(r.name) || !['Planned', 'Active', 'On Hold', 'Completed'].includes(r.status as string))) throw Error('Invalid project.');
      if (group === 'subjects' && (!text(r.name) || !text(r.color))) throw Error('Invalid subject.');
      if (group === 'inbox' && (!text(r.content) || !['task', 'note', 'link', 'idea'].includes(r.kind as string))) throw Error('Invalid inbox item.');
      if (group === 'focus' && (!text(r.startedAt) || !text(r.endedAt) || !Number.isFinite(Date.parse(r.startedAt as string)) || !Number.isFinite(Date.parse(r.endedAt as string)) || typeof r.minutes !== 'number' || r.minutes <= 0)) throw Error('Invalid focus session.');
      for (const key of ['url', 'github', 'website']) if (r[key] && !safeUrl(r[key] as string)) throw Error('Unsafe or invalid URL.');
    }
  }
  if (!object(data.settings) || !['light', 'dark'].includes(data.settings.theme as string) || typeof data.settings.privacy !== 'boolean' || !text(data.settings.name)) throw Error('Invalid settings.');
  if (data.dailyPriorities !== undefined && (!object(data.dailyPriorities) || Object.values(data.dailyPriorities).some(ids => !Array.isArray(ids) || ids.length > 3 || !ids.every(text) || new Set(ids).size !== ids.length))) throw Error('Invalid daily priorities.');
  if (data.focusState !== undefined && !object(data.focusState)) throw Error('Invalid timer state.');
  if (object(data.focusState)) {
    for (const key of ['endsAt', 'remaining', 'duration']) if (data.focusState[key] !== undefined && (typeof data.focusState[key] !== 'number' || !Number.isFinite(data.focusState[key]) || (data.focusState[key] as number) < 0)) throw Error('Invalid timer value.');
    for (const key of ['id', 'taskId', 'startedAt']) if (data.focusState[key] !== undefined && !text(data.focusState[key])) throw Error('Invalid timer field.');
  }
  return { version: 2, data: migrate(data as unknown as Store) };
}
export function previewBackup(value: unknown, current: Store) {
  const incoming = validateBackup(value).data;
  return groups.map(group => ({ group, incoming: incoming[group].length, conflicts: incoming[group].filter(r => current[group].some(c => c.id === r.id)).length }));
}
export function mergeBackup(current: Store, incoming: Store): Store {
  const result = { ...current };
  for (const group of groups) (result[group] as unknown[]) = [...current[group], ...incoming[group].filter(r => !current[group].some(c => c.id === r.id))];
  result.dailyPriorities = { ...incoming.dailyPriorities, ...current.dailyPriorities };
  return result;
}
export function exportBackup(data: Store, name = 'mydesk-backup') {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 2, data }, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
