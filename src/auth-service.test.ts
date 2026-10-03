import { beforeEach, expect, it, vi } from 'vitest';
import type { Auth } from 'firebase/auth';
const sdk = vi.hoisted(() => ({ persistence: vi.fn(), signup: vi.fn(), login: vi.fn(), verify: vi.fn() }));
vi.mock('firebase/auth', () => ({ browserLocalPersistence: 'local', browserSessionPersistence: 'session', setPersistence: sdk.persistence, createUserWithEmailAndPassword: sdk.signup, signInWithEmailAndPassword: sdk.login, sendEmailVerification: sdk.verify }));
import { authenticate } from './auth-service';
const provider = {} as Auth;
beforeEach(() => { vi.resetAllMocks(); });
it('sets session-only persistence before sign-in and trims only the email', async () => {
  await authenticate(provider, ' test@example.invalid ', ' dummy password ', false, false);
  expect(sdk.persistence).toHaveBeenCalledWith(provider, 'session');
  expect(sdk.login).toHaveBeenCalledWith(provider, 'test@example.invalid', ' dummy password ');
  expect(sdk.persistence.mock.invocationCallOrder[0]).toBeLessThan(sdk.login.mock.invocationCallOrder[0]);
  expect(sdk.signup).not.toHaveBeenCalled();
});
it('uses persistent sessions only with explicit remember preference and requests verification', async () => {
  const credential = { user: { uid: 'isolated-test-user', emailVerified: false } };
  sdk.signup.mockResolvedValue(credential);
  sdk.verify.mockRejectedValue(new Error('Mock email delivery failure'));
  expect(await authenticate(provider, 'test@example.invalid', 'dummy passphrase', true, true)).toBe(credential);
  expect(sdk.persistence).toHaveBeenCalledWith(provider, 'local');
  expect(sdk.verify).toHaveBeenCalledWith(credential.user);
  expect(sdk.login).not.toHaveBeenCalled();
});
it('does not authenticate if the chosen persistence cannot be applied', async () => {
  sdk.persistence.mockRejectedValue(new Error('Mock storage failure'));
  await expect(authenticate(provider, 'test@example.invalid', 'dummy passphrase', false, false)).rejects.toThrow('Mock storage failure');
  expect(sdk.login).not.toHaveBeenCalled();
});
