import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import { selectAccount } from './store';
import { validateSignup } from './auth-policy';
import { authenticate } from './auth-service';
import './account.css';
const Workspace = lazy(() => import('./workspace'));

export default function AccountRoot() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const [scope, setScope] = useState('guest');
  const [switchError, setSwitchError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function changeUser(next: User | null) {
      const ticket = ++sequence;
      setReady(false);
      try {
        const uid = next?.emailVerified ? next.uid : undefined;
        await selectAccount(uid);
        if (!active || ticket !== sequence) return;
        setUser(next); setScope(uid || 'guest'); setSwitchError(false); setReady(true); setOpened(true);
      } catch { if (active) setSwitchError(true); }
    }
    const unsubscribe = auth ? onAuthStateChanged(auth, changeUser, () => { setSwitchError(true); }) : undefined;
    if (!auth) void changeUser(null);
    return () => { active = false; unsubscribe?.(); };
  }, [revision]);
  const route = location.pathname.toLowerCase();
  const accountRoute = ['/', '/login', '/signup', '/account', '/privacy', '/security'].includes(route);
  // Keep the old workspace mounted if flushing fails, so unsaved edits can still be retried or exported.
  if (!accountRoute && opened) return <>{!ready && !switchError && <div className="account-notice" role="status">Saving before switching workspace…</div>}{switchError && <div className="account-notice" role="alert">Workspace switch stopped. Retry saving or export your current work first. <button onClick={() => setRevision(v => v + 1)}>Retry switch</button></div>}<div inert={!ready && !switchError}><Suspense fallback={<main className="account-page" role="status">Opening your workspace…</main>}><Workspace key={scope} accountWorkspace={scope !== 'guest'}/></Suspense></div></>;
  if (switchError) return <main className="account-page"><section className="account-card"><h1>Workspace could not switch</h1><p>Your records have not been cleared. Retry after resolving any local save error.</p><button onClick={() => setRevision(v => v + 1)}>Retry</button></section></main>;
  if (!ready) return <main className="account-page" role="status">Opening your workspace…</main>;
  const query = location.search;
  const link = (path: string) => path + query;
  const legal = route === '/privacy' || route === '/security';
  return <main className="account-page"><section className="account-intro"><img src="/mydesk-icon.png" alt="MyDesk" width="80" height="80"/><h1>Your day. Your space.</h1><p>A calm place for tasks, college work, projects and ideas.</p><ul><li>Your existing local workspace stays intact.</li><li>Account workspaces are stored separately on this device.</li><li>Cloud synchronization is not available.</li></ul><Link to={link('/Today')}>Continue to workspace →</Link><small>MyDesk 1.0.1 · Local-first</small></section><section className="account-card">
    {legal ? <><h2>{route === '/privacy' ? 'Privacy notice' : 'Security & your data'}</h2><p>Tasks, notes and backups stay in this browser or app’s local storage. They are not encrypted by MyDesk. Anyone with access to this device or its browser tools may access local records.</p><p>Optional accounts use Google Firebase Authentication. Your email and password are sent to that service to authenticate you; MyDesk does not save your password in its workspace or backups.</p><p>Signing in does not upload, transfer or encrypt your existing local records. Each verified account has a separate local workspace, not a cloud backup. Signing out preserves it. Browser and APK storage are separate; use backup export/import to transfer records.</p><p>Use a strong unique passphrase, device screen lock and HTTPS. “Remember me” keeps your session on this device; leave it off on shared devices. Account deletion is not offered in this version. Contact your Firebase project administrator for account removal.</p><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy policy</a><Link to={link('/login')}>Back to login</Link></> : user ? <><h2>{user.emailVerified ? 'Your account' : 'Verify your email'}</h2><p>{user.email}</p><p>{user.emailVerified ? 'Your account workspace is local to this device. Cloud sync remains unavailable.' : 'Open the verification link in your email before using your account workspace. Your original local workspace remains available.'}</p><AccountActions user={user} onChecked={() => setRevision(v => v + 1)}/><button className="primary" onClick={() => navigate(link('/Today'))}>Open workspace</button></> : <Credentials signup={route === '/signup'} onSuccess={() => navigate(link('/account'))} query={query}/>}
    <footer><Link to={link('/privacy')}>Privacy</Link><Link to={link('/security')}>Security</Link><Link to={link('/Today')}>Use without an account</Link></footer>
  </section></main>;
}

function AccountActions({ user, onChecked }: { user: User; onChecked: () => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>, success: string) { setBusy(true); setMessage(''); try { await action(); setMessage(success); } catch { setMessage('Could not complete this action. Check your connection and try again.'); } finally { setBusy(false); } }
  return <>{!user.emailVerified && <><button disabled={busy} onClick={() => void run(() => sendEmailVerification(user), 'Verification email requested. Check your inbox and spam folder.')}>Resend verification</button><button disabled={busy} onClick={() => void run(async () => { await user.reload(); onChecked(); }, user.emailVerified ? 'Verified.' : 'Email status refreshed.')}>I have verified my email</button></>}<button disabled={busy} onClick={() => void run(async () => { if (auth) await signOut(auth); }, 'Signed out.')}>Sign out</button><p role="status">{message}</p></>;
}

function Credentials({ signup, onSuccess, query }: { signup: boolean; onSuccess: () => void; query: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [remember, setRemember] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setPassword(''); setConfirmation(''); setMessage(''); }, [signup]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage('');
    if (!auth) return;
    const error = signup ? validateSignup(password, confirmation, consent) : undefined;
    if (error) { setMessage(error); return; }
    setBusy(true);
    try {
      await authenticate(auth, email, password, signup, remember);
      setPassword(''); setConfirmation(''); onSuccess();
    } catch { setMessage(signup ? 'Could not create an account. Check the details, connection and provider configuration, or try password reset.' : 'Could not sign in. Check your details and connection, or reset your password.'); }
    finally { setBusy(false); }
  }
  async function reset() {
    if (!auth || !email.trim()) { setMessage('Enter your email address first.'); return; }
    setBusy(true);
    try { await sendPasswordResetEmail(auth, email.trim()); } catch { /* Avoid exposing whether an email address has an account. */ }
    setMessage('If an eligible account exists and the request can be delivered, you will receive a reset email.'); setBusy(false);
  }
  return <><h2>{signup ? 'Create your account' : 'Welcome back'}</h2><p>{signup ? 'A separate space for your work, on this device.' : 'Sign in to your account workspace.'}</p>{!auth && <p className="account-notice" role="status">Account access is unavailable until Firebase Authentication is configured. You can continue using your local workspace.</p>}<form onSubmit={e => void submit(e)}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : undefined} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)}/>{signup && <small>Use a unique passphrase of at least 12 characters.</small>}</label>{signup && <><label>Confirm password<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)}/></label><label className="account-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>I have read the privacy notice and understand Firebase processes my account credentials.</label></>}<label className="account-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>Remember me on this device</label><p role="status" aria-live="polite">{message}</p><button className="primary" disabled={busy || !auth}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button></form>{!signup && <button disabled={busy || !auth} onClick={() => void reset()}>Forgot password?</button>}<p>{signup ? 'Already have an account?' : 'New to MyDesk?'} <Link to={(signup ? '/login' : '/signup') + query}>{signup ? 'Sign in' : 'Create account'}</Link></p></>;
}
