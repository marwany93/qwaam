import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // 1. المحاولة الأولى: التشغيل المحلي (Local) باستخدام ملف الـ JSON
    // المسار ده بيفترض إن الملف جنب package.json
    const serviceAccount = require('../../firebase-key.json');
    console.log("✅ [Local Mode] Loaded Firebase Admin from JSON file.");

    return initializeApp({
      credential: cert(serviceAccount),
    });

  } catch (error) {
    // 2. المحاولة الثانية: التشغيل على السيرفر (Vercel) باستخدام المتغيرات
    console.log("☁️ [Production Mode] Attempting to load from Vercel Env Variables...");

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.error("❌ Missing Env Vars:");
      console.error("- ProjectID:", !!projectId);
      console.error("- ClientEmail:", !!clientEmail);
      console.error("- PrivateKey:", !!privateKey);
      throw new Error('[firebase-admin] Missing required Firebase Admin environment variables.');
    }

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}