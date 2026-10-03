import {initializeApp,getApps} from 'firebase/app';import {initializeAuth,getAuth,browserSessionPersistence} from 'firebase/auth';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID};
export const firebaseConfigured=Object.values(config).every(Boolean);
function initializeAccountAccess() {
  if (!firebaseConfigured) return undefined;
  try {
    const app = getApps()[0] || initializeApp(config);
    try { return initializeAuth(app, { persistence: browserSessionPersistence }); }
    catch (error) {
      if ((error as { code?: string }).code === 'auth/already-initialized') return getAuth(app);
      return undefined;
    }
  } catch { return undefined; }
}
export const auth = initializeAccountAccess();
