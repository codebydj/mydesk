import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Store, Task } from './types';
vi.stubGlobal('location', { search: '?workspace=unit-tests' });
let storage: typeof import('./store');
let backup: typeof import('./backup');
beforeAll(async () => { storage = await import('./store'); backup = await import('./backup'); });
const task = (): Task => ({ id: 'stable-id', title: 'Verify local persistence', priority: 'medium', tags: [], subtasks: [], status: 'open', createdAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z', isPriority: true });
describe('record-preserving migrations and imports', () => {
  it('preserves stable IDs and records while migrating legacy priorities', () => {
    const old = { ...storage.empty(), version: 2, tasks: [task()] };
    delete (old as Partial<Store>).dailyPriorities;
    const migrated = storage.migrate(old as unknown as Store);
    expect(migrated.tasks).toEqual([task()]);
    expect(migrated.version).toBe(4);
    expect(migrated.dailyPriorities[storage.localDate()]).toEqual(['stable-id']);
  });
  it('keeps existing records and settings on merge collisions', () => {
    const current = { ...storage.empty(), tasks: [task()], settings: { ...storage.empty().settings, name: 'Existing' } };
    const incoming = { ...storage.empty(), tasks: [{ ...task(), title: 'Changed' }, { ...task(), id: 'new-id' }] };
    expect(backup.previewBackup({ version: 2, data: incoming }, current)[0]).toEqual({ group: 'tasks', incoming: 2, conflicts: 1 });
    const merged = backup.mergeBackup(current, incoming);
    expect(merged.tasks.map(t => t.title)).toEqual(['Verify local persistence', 'Verify local persistence']);
    expect(merged.settings.name).toBe('Existing');
    expect(current.tasks).toHaveLength(1);
  });
  it('rejects unsafe URLs, malformed records, duplicate IDs, and future schemas', () => {
    const data = storage.empty();
    expect(() => backup.validateBackup({ version: 2, data: { ...data, tasks: [task(), task()] } })).toThrow();
    expect(() => backup.validateBackup({ version: 2, data: { ...data, version: 99 } })).toThrow();
    expect(() => backup.validateBackup({ version: 2, data: { ...data, notes: [{ id: 'n', title: 'unsafe', body: '', tags: [], pinned: false, createdAt: task().createdAt, url: 'javascript:alert(1)' }] } })).toThrow();
    expect(() => backup.validateBackup({ version: 2, data: { ...data, tasks: [{ ...task(), tags: 'broken' }] } })).toThrow();
    expect(() => backup.validateBackup({ version: 2, data: { ...data, focusState: { endsAt: 'broken' } } })).toThrow();
    expect(backup.safeUrl('https://example.com')).toBe('https://example.com/');
    expect(backup.safeUrl('https://user:password@example.com')).toBeUndefined();
  });
  it('round-trips valid records without interpreting note markup', () => {
    const data = { ...storage.empty(), tasks: [task()], notes: [{ id: 'n', title: 'Plain text', body: '<script>alert(1)</script>', tags: ['reference'], pinned: true, createdAt: task().createdAt, updatedAt: task().updatedAt }] };
    expect(backup.validateBackup(JSON.parse(JSON.stringify({ version: 2, data }))).data).toEqual(data);
  });
});
