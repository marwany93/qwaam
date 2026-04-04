// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * 💡 ملاحظة هندسية:
 * المتصفح (Browser) لا يرى إلا المتغيرات التي تبدأ بـ NEXT_PUBLIC_.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // 👈 التأكد من الاسم الجديد
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// تشغيل فايربيس (Singleton Pattern) لمنع تكرار الـ Apps في الـ Dev Mode
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// تصدير (Export) الـ Auth والـ DB للاستخدام في المشروع
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;