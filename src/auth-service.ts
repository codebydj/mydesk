import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, sendEmailVerification, setPersistence, signInWithEmailAndPassword, type Auth } from 'firebase/auth';
export async function authenticate(provider: Auth, email: string, password: string, signup: boolean, remember: boolean) {
  await setPersistence(provider, remember ? browserLocalPersistence : browserSessionPersistence);
  if (!signup) return signInWithEmailAndPassword(provider, email.trim(), password);
  const credential = await createUserWithEmailAndPassword(provider, email.trim(), password);
  try { await sendEmailVerification(credential.user); } catch { /* The account page exposes resend, including after delivery failure. */ }
  return credential;
}
