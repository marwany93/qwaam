'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { verifyClientAccess } from '@/lib/auth-utils';
import type { QwaamUser, Workout, Meal } from '@/types';
import { Resend } from 'resend';
import { ResetPasswordTemplate } from '@/emails/ResetPasswordTemplate';
import { sendNotification } from '@/actions/notification-actions';
import { WelcomeTemplate } from '@/emails/WelcomeTemplate';
import { headers } from 'next/headers';

// تهيئة Resend
//const resend = new Resend(process.env.RESEND_API_KEY);

export async function getCurrentTrainee(): Promise<QwaamUser | null> {
  const decodedToken = await verifyClientAccess();
  const db = getAdminDb();

  const doc = await db.collection('users').doc(decodedToken.uid).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    uid: doc.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  } as QwaamUser;
}

export async function fetchMyWorkouts(workoutIds: string[]): Promise<Workout[]> {
  await verifyClientAccess();
  if (!workoutIds || workoutIds.length === 0) return [];

  const db = getAdminDb();
  const snapshot = await db.collection('workouts').where('__name__', 'in', workoutIds).get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    } as Workout;
  });
}

export async function fetchMyMeals(mealIds: string[]): Promise<Meal[]> {
  await verifyClientAccess();
  if (!mealIds || mealIds.length === 0) return [];

  const db = getAdminDb();
  const snapshot = await db.collection('meals').where('__name__', 'in', mealIds).get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    } as Meal;
  });
}

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

export async function updateTraineeProfile(uid: string, data: Record<string, any>) {
  // Ensure the user only updates their own profile
  const decodedToken = await verifyClientAccess();
  if (decodedToken.uid !== uid) {
    throw new Error('Unauthorized');
  }

  const db = getAdminDb();

  // Recursively sanitize undefined -> null since Firestore rejects undefined deeply
  const sanitizedData = sanitizeForFirestore(data);

  // Construct update payload using dot-notation to ONLY update 'onboarding' fields
  // and the top-level 'name' field if provided.
  const updatePayload: Record<string, any> = {};

  if (sanitizedData.name) {
    updatePayload['name'] = sanitizedData.name;
  }

  for (const [key, value] of Object.entries(sanitizedData)) {
    // Skip name as it's handled above
    if (key === 'name') continue;

    updatePayload[`onboarding.${key}`] = value;
  }

  if (Object.keys(updatePayload).length > 0) {
    await db.collection('users').doc(uid).update(updatePayload);
  }

  return { success: true };
}

/**
 * Creates the initial user document in Firestore.
 * Handles the server-side write to bypass client-side rules and serialization bugs.
 */
export async function submitOnboarding(uid: string, docPayload: Record<string, any>) {
  try {
    const db = getAdminDb();

    // Server actions must use native Dates or Admin SDK timestamps
    const payload = {
      ...docPayload,
      createdAt: new Date(),
    };

    await db.collection('users').doc(uid).set(payload);

    // 🚀 إرسال إيميل الترحيب في الخلفية (بدون await عشان منأخرش المتدربة)
    if (docPayload.email && docPayload.name) {
      sendNotification({
        to: docPayload.email,
        subject: 'أهلاً بكِ في عائلة قوام! 🌸',
        template: WelcomeTemplate({ userName: docPayload.name }),
      }).catch((err) => console.error('Failed to send welcome email:', err));
    }

    return { success: true, uid };
  } catch (err: any) {
    console.error('Error in submitOnboarding:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Handles the "Forgot Password" request by generating a Firebase reset link
 * and sending it via Resend using a React Email template.
 */
export async function requestPasswordReset(email: string) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. التحقق من وجود المستخدم (نفس الكود القديم)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') return { success: false, message: 'هذا البريد غير مسجل لدينا.' };
      throw error;
    }

    // --- 🚀 بداية التعديل الذكي للدومين ---
    const headerList = await headers();
    const host = headerList.get('host'); // بيجيب الدومين الحالي (مثلاً qwaam-xyz.vercel.app)
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    // --- نهاية التعديل الذكي ---

    // 2. جلب الاسم (نفس الكود القديم)
    let userName = 'متدربتنا';
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) userName = userDoc.data()?.name || 'متدربتنا';

    // 3. توليد الرابط باستخدام الدومين الجديد
    const firebaseLink = await auth.generatePasswordResetLink(email, {
      url: `${baseUrl}/login`, // الرابط اللي هيرجع عليه بعد التغيير
    });

    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');

    // الرابط المخصص دلوقتي هيتبني بالدومين اللي السيرفر شغال عليه فعلياً
    const customResetLink = `${baseUrl}/reset-password?oobCode=${oobCode}`;

    // 4. إرسال الإيميل عبر Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_FROM_EMAIL || 'Qwaam <onboarding@resend.dev>',
      to: [email],
      subject: 'إعادة تعيين كلمة المرور - قوام',
      react: ResetPasswordTemplate({ userName, resetLink: customResetLink }),
    });

    if (error) throw error;
    return { success: true, message: 'تم إرسال رابط إعادة التعيين بنجاح.' };
  } catch (err: any) {
    console.error('Reset Error:', err);
    return { success: false, message: 'حدث خطأ غير متوقع.' };
  }
}