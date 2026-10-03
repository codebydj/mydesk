import { beforeAll, expect, it, vi } from 'vitest';
import type { Task } from './types';
vi.stubGlobal('location', { search: '?workspace=unit-tests' });
let storage: typeof import('./store');
let actions: typeof import('./actions');
beforeAll(async () => { storage = await import('./store'); actions = await import('./actions'); });
it('archives, trashes and restores tasks without losing completion or associations', () => {
  const task: Task = { id: 'stable', title: 'Keep me', description: 'Content', priority: 'high', status: 'completed', projectId: 'project', subjectId: 'subject', tags: [], subtasks: [], createdAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z' };
  const archived = actions.lifecycleRecord(task, 'tasks', 'archive');
  const trashed = actions.lifecycleRecord(archived, 'tasks', 'trash');
  expect(trashed.deletedAt).toBeTruthy();
  expect(actions.lifecycleRecord(trashed, 'tasks', 'restore')).toMatchObject({ id: 'stable', status: 'completed', projectId: 'project', subjectId: 'subject', description: 'Content', deletedAt: undefined });
});
it('preserves multiline content and prevents repeat inbox conversions', () => {
  const content = 'Title\n  Details and https://example.com\n';
  const initial = { ...storage.empty(), inbox: [{ id: 'source', content, kind: 'idea' as const, createdAt: '2026-10-03T00:00:00Z' }] };
  const converted = actions.convertInbox(initial, 'source');
  expect(converted.tasks[0]).toMatchObject({ title: 'Title', description: content, sourceInboxId: 'source' });
  expect(converted.inbox[0].content).toBe(content);
  expect(actions.convertInbox(converted, 'source')).toBe(converted);
});
it('restores notes, projects, subjects and inbox items without changing their IDs', () => {
  const item = { id: 'item', name: 'Project', status: 'Active' as const, createdAt: '2026-10-03T00:00:00Z' };
  for (const group of ['projects', 'notes', 'subjects', 'inbox'] as const) {
    const trashed = actions.lifecycleRecord(item, group, 'trash');
    expect(trashed.deletedAt).toBeTruthy();
    expect(actions.lifecycleRecord(trashed, group, 'restore')).toMatchObject({ id: 'item', deletedAt: undefined, archived: false });
  }
});
it('completes running timers once, and leaves paused or cancelled timers alone', () => {
  const state = { ...storage.empty(), focusState: { id: 'session', endsAt: 10000, duration: 1500, startedAt: '2026-10-03T00:00:00Z', taskId: 'task' } };
  expect(actions.finishFocus(state, 9999)).toBe(state);
  const done = actions.finishFocus(state, 10000);
  expect(done.focus).toHaveLength(1);
  expect(done.focus[0]).toMatchObject({ id: 'session', minutes: 25, taskId: 'task' });
  expect(actions.finishFocus(done, 20000)).toBe(done);
  expect(actions.finishFocus({ ...done, focusState: state.focusState }, 20000).focus).toHaveLength(1);
  const paused = { ...storage.empty(), focusState: { remaining: 42 } };
  expect(actions.finishFocus(paused, 20000)).toBe(paused);
});
