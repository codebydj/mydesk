import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
vi.stubGlobal('location', { search: '' });
it('flushes queued saves before switching and preserves personal/account records on reload', async () => {
  const store = await import('./store');
  const personal = store.empty(); personal.settings.name = 'Existing personal records';
  const firstSave = store.save(personal);
  await store.selectAccount('alice'); await firstSave;
  expect((await store.load()).settings.name).toBe('');
  const alice = store.empty(); alice.settings.name = 'Alice local records';
  const aliceSave = store.save(alice);
  await store.selectAccount('bob'); await aliceSave;
  expect((await store.load()).settings.name).toBe('');
  await store.selectAccount(); expect((await store.load()).settings.name).toBe('Existing personal records');
  await store.selectAccount('alice'); expect((await store.load()).settings.name).toBe('Alice local records');
  await store.saveRecovery(alice);
  await store.selectAccount('bob'); expect(await store.loadRecovery()).toBeUndefined();
  await store.selectAccount('alice'); expect((await store.loadRecovery())?.settings.name).toBe('Alice local records');
});
