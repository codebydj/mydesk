import { openDB } from 'idb';
import type { Store } from './types';
export const empty = (): Store => ({ version: 4, tasks: [], projects: [], notes: [], inbox: [], subjects: [], focus: [], dailyPriorities: {}, settings: { theme: 'light', privacy: false, name: '' } });
export function migrate(raw: Partial<Store> | undefined): Store {
  const base = empty();
  if (raw && Number(raw.version) > 4) throw new Error('This workspace needs a newer version of MyDesk.');
  const result = { ...base, ...raw, version: 4 as const, settings: { ...base.settings, ...raw?.settings }, dailyPriorities: { ...raw?.dailyPriorities } };
  if (!raw?.dailyPriorities) result.dailyPriorities[localDate()] = (raw?.tasks || []).filter(t => t.isPriority && t.status === 'open').slice(0, 3).map(t => t.id);
  return result;
}
export const workspace = new URLSearchParams(location.search).get('workspace');
export function workspaceKey(testWorkspace: string | null, uid?: string) { return testWorkspace ? 'test:' + testWorkspace : uid ? 'account:' + uid : 'personal'; }
let accountUid: string | undefined;
const key = () => workspaceKey(workspace, accountUid);
const db = () => openDB('mydesk', 3, { upgrade(database) { if (!database.objectStoreNames.contains('workspace')) database.createObjectStore('workspace'); } });
export async function load(): Promise<Store> { return migrate(await (await db()).get('workspace', key())); }
let pending: Promise<unknown> = Promise.resolve();
export function save(data: Store): Promise<void> {
  const destination = key();
  const operation = pending.catch(() => undefined).then(async () => { await (await db()).put('workspace', data, destination); });
  pending = operation;
  return operation.catch(() => { throw new Error('Could not save locally. Your changes remain on screen. Retry saving or export a backup.'); });
}
export async function selectAccount(uid?: string) { await pending; accountUid = uid; }
export async function flushSaves() { await pending; }
export async function saveRecovery(data: Store) { const destination = 'recovery:' + key(); await pending; await (await db()).put('workspace', data, destination); }
export async function loadRecovery(): Promise<Store | undefined> { return (await db()).get('workspace', 'recovery:' + key()); }
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
