/**
 * Firebase Client-Side Modular SDK (v10+)
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is safe to import in Client Components ('use client').
 * ALL env vars use NEXT_PUBLIC_ prefix — they are intentionally public.
 *
 * The getApps() guard ensures we never initialize more than once,
 * which is critical for Next.js HMR and SSR/client boundary crossing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern: reuse existing app on hot reloads
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export individual service singletons
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
