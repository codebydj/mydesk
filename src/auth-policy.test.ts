import { expect, it, vi } from 'vitest';
import { validateSignup } from './auth-policy';
vi.stubGlobal('location', { search: '?workspace=auth-unit-tests' });
it('requires a long matching passphrase and explicit privacy acknowledgement', () => {
  expect(validateSignup('short', 'short', true)).toMatch(/12 characters/);
  expect(validateSignup('a'.repeat(129), 'a'.repeat(129), true)).toMatch(/128/);
  expect(validateSignup('long passphrase!', 'different phrase', true)).toMatch(/match/);
  expect(validateSignup('long passphrase!', 'long passphrase!', false)).toMatch(/privacy/);
  expect(validateSignup('long passphrase!', 'long passphrase!', true)).toBeUndefined();
});
it('keeps existing personal keys, separate account keys and isolated test keys', async () => {
  const { workspaceKey } = await import('./store');
  expect(workspaceKey(null)).toBe('personal');
  expect(workspaceKey(null, 'alice')).toBe('account:alice');
  expect(workspaceKey(null, 'bob')).not.toBe(workspaceKey(null, 'alice'));
  expect(workspaceKey('separate-test', 'alice')).toBe('test:separate-test');
});
