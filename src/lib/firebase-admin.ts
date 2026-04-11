import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountEnv) {
    throw new Error('[firebase-admin] Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    
    // Handle Vercel environment variable newlines safely
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin.");
    throw error;
  }
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}