// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// E2E / local-testing flag. When 'true' the client SDK talks to the local
// Firebase emulators instead of the real project, and App Check is skipped.
// Default (undefined/anything else) leaves dev + production completely untouched.
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

/**
 * 💡 ملاحظة هندسية:
 * المتصفح (Browser) لا يرى إلا المتغيرات التي تبدأ بـ NEXT_PUBLIC_.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton — Next.js dev mode hot-reloads modules, so re-init would throw.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ── App Check (reCAPTCHA v3) ──────────────────────────────────────────────────
// MUST run before any Firestore/Storage call so those calls carry the App
// Check token. Browser-only — server-side code uses the Admin SDK which
// bypasses App Check entirely.
//
// Debug token (dev only):
//   1. set NEXT_PUBLIC_APPCHECK_DEBUG=true in .env.local
//   2. open the browser console on first load → copy the token
//   3. paste it into Firebase Console → App Check → Apps → Manage debug tokens
//
// The `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` line tells the SDK to print
// the token. After registering it in the console, App Check will accept the
// same token on every page load from your machine.
if (!USE_EMULATOR && typeof window !== 'undefined') {
  try {
    // Enable the SDK's debug-token printer in development. Production builds
    // must NEVER set this — would leak past reCAPTCHA enforcement.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_APPCHECK_DEBUG === 'true'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (siteKey && typeof siteKey === 'string' && siteKey.length > 0) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else {
      // Visible warning in BOTH environments so a Vercel build with a
      // missing env var doesn't silently ship without App Check protection.
      // Was previously silent in dev — that hid the misconfig until
      // permission-denied errors started cascading.
      console.warn(
        '[firebase] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing — App Check is NOT initialized. ' +
          'Firestore/Storage will still work unless App Check enforcement is enabled in the Firebase Console.',
      );
    }
  } catch (err) {
    // App Check is best-effort: a misconfig should not kill the whole app.
    // Firestore/Storage will start failing if App Check is enforced and the
    // token is missing — those errors are the actual signal for the dev.
    console.error('[firebase] App Check init failed:', err);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ── Emulator wiring (E2E / local testing only) ────────────────────────────────
// Connect ONCE — Next.js dev/HMR re-evaluates this module, and the SDK throws
// "already connected" if connect* runs twice. A module-scoped guard makes it
// idempotent. Ports mirror the `emulators` block in firebase.json.
let emulatorsConnected = false;
if (USE_EMULATOR && !emulatorsConnected) {
  emulatorsConnected = true;
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  } catch (err) {
    // Under HMR the underlying instances may already be pointed at the emulator;
    // that's fine — swallow the idempotency error, surface anything unexpected.
    console.warn('[firebase] emulator connect skipped (already connected?):', err);
  }
}

export default app;
