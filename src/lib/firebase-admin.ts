/**
 * Firebase Admin SDK — SERVER ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  NEVER import this file in Client Components or pages marked 'use client'.
 *     It uses Node.js APIs and will crash in the browser.
 *
 * Usage:
 *   - Server Components (layout.tsx, page.tsx without 'use client')
 *   - Route Handlers (app/api/**)
 *   - Server Actions
 *
 * Credentials:
 *   Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local as a single-line
 *   stringified JSON of your Firebase service account key file.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  // Reuse existing admin app instance (important for serverless/cold-starts)
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      '[firebase-admin] Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable. ' +
      'Add it to your .env.local file. See .env.local.example for instructions.'
    );
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    throw new Error(
      '[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. ' +
      'Ensure it is a single-line stringified JSON object.'
    );
  }

  return initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
