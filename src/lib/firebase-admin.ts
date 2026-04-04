/**
 * Firebase Admin SDK — SERVER ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  NEVER import this file in Client Components or pages marked 'use client'.
 * It uses Node.js APIs and will crash in the browser.
 *
 * Usage:
 * - Server Components (layout.tsx, page.tsx without 'use client')
 * - Route Handlers (app/api/**)
 * - Server Actions
 *
 * Credentials:
 * Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY 
 * in .env.local and Vercel.
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

  // قراءة المفاتيح الثلاثة الجديدة
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // التأكد من وجودهم كلهم
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebase-admin] Missing required Firebase Admin environment variables. ' +
      'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
    );
  }

  // ⚠️ التريكة السحرية: فك شفرة Vercel لعلامات السطر الجديد
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // تهيئة فايربيس بالطريقة الآمنة
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}