'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { verifyClientAccess } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { QwaamUser, Workout, Meal, ProgressEntry } from '@/types';
import { Resend } from 'resend';
import { ResetPasswordTemplate } from '@/emails/ResetPasswordTemplate';
import { sendNotification } from '@/actions/notification-actions';
import { WelcomeTemplate } from '@/emails/WelcomeTemplate';
import { headers } from 'next/headers';
import { findPlanById } from '@/lib/pricing-config';
import { serializeFirestoreData } from '@/lib/firestore-serialize';

// تهيئة Resend
//const resend = new Resend(process.env.RESEND_API_KEY);

export async function getCurrentTrainee(): Promise<QwaamUser | null> {
  // Swallow auth/network errors so the page can render its
  // "اتصال غير مستقر" fallback instead of throwing a 500. Throws here
  // would bubble out of the Server Component and produce an error-boundary
  // page, not the friendly Arabic message.
  //
  // Detailed logging is TEMPORARY — added to diagnose Vercel-only failures.
  // Once the issue is confirmed (cookie missing vs Admin SDK init vs
  // verifySessionCookie reject), strip the [trace] lines back out.
  try {
    console.info('[trace] getCurrentTrainee start');

    const decodedToken = await verifyClientAccess();
    console.info('[trace] getCurrentTrainee — verified uid:', decodedToken.uid, 'role:', decodedToken.role);

    let db;
    try {
      db = getAdminDb();
    } catch (initErr) {
      console.error('[trace] getCurrentTrainee — Admin SDK init failed. ' +
        'Check FIREBASE_SERVICE_ACCOUNT_KEY on Vercel:', initErr);
      return null;
    }

    const doc = await db.collection('users').doc(decodedToken.uid).get();
    if (!doc.exists) {
      console.warn('[trace] getCurrentTrainee — user doc missing for uid:', decodedToken.uid);
      return null;
    }

    // Recursive sanitizer — converts every nested Firestore Timestamp into
    // a plain number so the result is safe to pass back to a Client Component.
    return serializeFirestoreData({
      uid: doc.id,
      ...doc.data(),
    }) as QwaamUser;
  } catch (err: any) {
    // Distinguish the common failure modes so the Vercel logs are useful
    const msg = err?.message || String(err);
    if (msg.includes('Session not found')) {
      console.warn('[trace] getCurrentTrainee — qwaam_session cookie missing on request');
    } else if (msg.includes('Forbidden')) {
      console.warn('[trace] getCurrentTrainee — auth role mismatch:', msg);
    } else if (msg.includes('verifySessionCookie') || err?.code?.startsWith?.('auth/')) {
      console.error('[trace] getCurrentTrainee — session cookie verify failed:', err?.code || msg);
    } else {
      console.error('[trace] getCurrentTrainee — unknown error:', err);
    }
    return null;
  }
}

export async function fetchMyWorkouts(workoutIds: string[]): Promise<Workout[]> {
  await verifyClientAccess();
  if (!workoutIds || workoutIds.length === 0) return [];

  const db = getAdminDb();
  const snapshot = await db.collection('workouts').where('__name__', 'in', workoutIds).get();

  const workouts: Workout[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    } as Workout;
  });

  // Join exercises collection to embed nameAr + videoUrl into each WorkoutExercise
  // so the trainee dashboard can show exercise names and clickable video links.
  const allExerciseIds = [
    ...new Set(workouts.flatMap(w => w.exercises?.map(e => e.exerciseId) ?? []))
  ].filter(Boolean);

  if (allExerciseIds.length > 0) {
    const exSnapshot = await db
      .collection('exercises')
      .where('__name__', 'in', allExerciseIds.slice(0, 30))
      .get();

    const exMap: Record<string, { nameAr: string; videoUrl?: string }> = {};
    exSnapshot.docs.forEach(d => {
      exMap[d.id] = { nameAr: d.data().nameAr, videoUrl: d.data().videoUrl || undefined };
    });

    workouts.forEach(w => {
      w.exercises = w.exercises?.map(ex => ({
        ...ex,
        nameAr: exMap[ex.exerciseId]?.nameAr,
        videoUrl: exMap[ex.exerciseId]?.videoUrl,
      }));
    });
  }

  return workouts;
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

    // Resolve initialSessions in priority order:
    //   1. Explicit planSessions hint from the client wizard
    //   2. Derived from traineeData.subscription.planId via the pricing config
    //   3. Fallback to 0 — makes a missing plan visible instead of silently
    //      granting 12 free sessions (the previous default that hid the bug)
    let initialSessions = Number(docPayload.planSessions);

    if (!Number.isFinite(initialSessions) || initialSessions <= 0) {
      const planId = docPayload?.traineeData?.subscription?.planId as string | undefined;
      if (planId) {
        const plan = findPlanById(planId);
        initialSessions = plan?.sessions ?? plan?.days ?? 0;
      } else {
        initialSessions = 0;
      }
    }

    // Strip planSessions from the persisted doc — it's a transport-only hint,
    // not part of the QwaamUser shape. sessionTracking is the source of truth.
    const { planSessions: _planSessions, ...rest } = docPayload;

    const payload = {
      ...rest,
      createdAt: new Date(),
      sessionTracking: {
        totalSessions: initialSessions,
        remainingSessions: initialSessions,
        planStatus: initialSessions > 0 ? 'active' : 'finished',
        lastRenewedAt: new Date(),
      },
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
      from: 'Qwaam <no-reply@qwaam.net>',
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

/**
 * Full renewal flow: trainee has already selected a plan and uploaded proof.
 * 1. Writes a `renewal_requests` document so the admin can review in one place.
 * 2. Updates subscription.status → 'pending_payment' with the chosen plan + proof
 *    so PendingPaymentBanner appears and PendingPaymentCard is pre-filled.
 */
export async function requestPlanRenewal(
  planId: string,
  proofUrl: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const decoded = await verifyClientAccess();
    const plan = findPlanById(planId);
    if (!plan) return { success: false, message: 'الباقة المختارة غير صالحة.' };
    if (!proofUrl) return { success: false, message: 'يرجى رفع صورة إيصال الدفع أولاً.' };

    const db = getAdminDb();

    // Write renewal_requests document (admin reads this to get pre-filled values)
    await db.collection('renewal_requests').add({
      traineeUid: decoded.uid,
      planId,
      amount: plan.price,
      proofUrl,
      status: 'pending',
      createdAt: new Date(),
    });

    // Update trainee subscription so existing banners + admin card work
    await db.collection('users').doc(decoded.uid).update({
      'traineeData.subscription.status': 'pending_payment',
      'traineeData.subscription.planId': planId,
      'traineeData.subscription.amountPaid': String(plan.price),
      'traineeData.subscription.paymentScreenshotUrl': proofUrl,
      'traineeData.subscription.paymentScreenshotAt': new Date(),
      'renewalRequest.requested': true,
      'renewalRequest.requestedAt': new Date(),
      'renewalRequest.status': 'pending',
    });

    revalidatePath('/client');
    return { success: true, message: 'تم إرسال طلبك بنجاح، سيتواصل معك المدرب قريباً.' };
  } catch (err: any) {
    console.error('requestPlanRenewal error:', err);
    return { success: false, message: 'حدث خطأ أثناء إرسال الطلب.' };
  }
}

/**
 * "Buy More Sessions" flow: sets the trainee's subscription status back to
 * `pending_payment` so the PendingPaymentBanner reappears on the client
 * dashboard and the admin sees PendingPaymentCard on the trainee detail page.
 * Clears any stale payment screenshot so the trainee can upload a fresh one.
 */
export async function requestMoreSessions(): Promise<{ success: boolean; message: string }> {
  try {
    const decoded = await verifyClientAccess();
    const db = getAdminDb();
    const userRef = db.collection('users').doc(decoded.uid);

    await userRef.update({
      'traineeData.subscription.status': 'pending_payment',
      'traineeData.subscription.paymentScreenshotUrl': null,
      'traineeData.subscription.paymentScreenshotAt': null,
      'renewalRequest.requested': true,
      'renewalRequest.requestedAt': new Date(),
      'renewalRequest.status': 'pending',
    });

    revalidatePath('/client');
    return { success: true, message: 'تم إرسال طلبك بنجاح، سيتواصل معك المدرب قريباً.' };
  } catch (err: any) {
    console.error('requestMoreSessions error:', err);
    return { success: false, message: 'حدث خطأ أثناء إرسال الطلب.' };
  }
}

/**
 * MVP renewal request: flags the trainee's document so the coach sees a
 * pending renewal in the admin panel. No payment flow — the coach contacts
 * the trainee to collect payment then manually renews via the admin panel.
 */
export async function requestRenewal(): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await verifyClientAccess();
    const db = getAdminDb();

    await db.collection('users').doc(decodedToken.uid).update({
      'renewalRequest.requested': true,
      'renewalRequest.requestedAt': new Date(),
      'renewalRequest.status': 'pending',
    });

    return { success: true, message: 'تم إرسال طلب التجديد، سيتواصل معك المدرب قريباً.' };
  } catch (err: any) {
    console.error('requestRenewal error:', err);
    return { success: false, message: 'حدث خطأ أثناء إرسال الطلب.' };
  }
}

/**
 * Saves a payment proof screenshot URL (already uploaded to Firebase Storage
 * by the client) onto the trainee's subscription doc. The admin sees a
 * thumbnail in the PendingPaymentCard so they can verify the transfer
 * before clicking "Confirm & Activate".
 */
export async function updatePaymentScreenshot(url: string) {
  try {
    const decoded = await verifyClientAccess();
    if (!url || typeof url !== 'string') {
      return { success: false, error: 'رابط الصورة غير صالح.' };
    }

    const db = getAdminDb();
    await db.collection('users').doc(decoded.uid).update({
      'traineeData.subscription.paymentScreenshotUrl': url,
      'traineeData.subscription.paymentScreenshotAt': new Date(),
    });

    return { success: true };
  } catch (err: any) {
    console.error('updatePaymentScreenshot error:', err);
    return { success: false, error: 'فشل حفظ صورة التحويل.' };
  }
}

// ── Progress Tracking ─────────────────────────────────────────────────────────

export type LogProgressInput = Omit<ProgressEntry, 'id' | 'date' | 'traineeUid'>;

/**
 * Trainee logs a progress entry (weight + optional body fat + measurements +
 * photo URLs + notes). Server stamps the date and the trainee uid.
 */
export async function logProgress(
  data: LogProgressInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const decoded = await verifyClientAccess();

    if (typeof data?.weight !== 'number' || !Number.isFinite(data.weight) || data.weight <= 0) {
      return { success: false, error: 'الوزن مطلوب ويجب أن يكون رقماً موجباً.' };
    }
    if (data.bodyFat != null && (!Number.isFinite(data.bodyFat) || data.bodyFat < 0 || data.bodyFat > 100)) {
      return { success: false, error: 'نسبة الدهون يجب أن تكون بين 0 و 100.' };
    }

    const db = getAdminDb();
    const doc = await db.collection('trainee_progress').add({
      traineeUid: decoded.uid,
      date: new Date(),                                         // server timestamp
      weight: data.weight,
      bodyFat: data.bodyFat ?? null,
      measurements: data.measurements ?? null,
      photos: data.photos ?? null,
      notes: data.notes?.trim() || null,
    });

    revalidatePath('/client');
    return { success: true, id: doc.id };
  } catch (err: any) {
    console.error('logProgress error:', err);
    return { success: false, error: 'فشل حفظ سجل التقدم.' };
  }
}

/**
 * Fetches progress history. Role-aware:
 *   - Trainee caller: returns own history (traineeUid arg ignored).
 *   - Coach caller: returns the requested trainee's history (traineeUid required).
 *
 * Requires composite index: (traineeUid ASC, date DESC) on trainee_progress.
 */
export async function getProgressHistory(
  traineeUid?: string,
): Promise<{ success: boolean; data?: ProgressEntry[]; error?: string }> {
  try {
    // Decode the session cookie ourselves so we can branch on role without
    // running BOTH verifyClientAccess and verifyAdminAccess (each throws on
    // the wrong role, so we can't just try/catch them sequentially cleanly).
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('qwaam_session')?.value;
    if (!sessionCookie) return { success: false, error: 'Unauthorized' };

    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const role = decoded.role;

    let targetUid: string;
    if (role === 'coach' || role === 'admin') {
      if (!traineeUid) return { success: false, error: 'معرّف المتدرّبة مطلوب.' };
      targetUid = traineeUid;
    } else if (role === 'trainee') {
      targetUid = decoded.uid;
    } else {
      return { success: false, error: 'Forbidden' };
    }

    const db = getAdminDb();
    const snap = await db
      .collection('trainee_progress')
      .where('traineeUid', '==', targetUid)
      .orderBy('date', 'desc')
      .get();

    const data: ProgressEntry[] = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        traineeUid: raw.traineeUid,
        date: raw.date?.toMillis ? raw.date.toMillis() : Date.now(),
        weight: raw.weight,
        bodyFat: raw.bodyFat ?? undefined,
        measurements: raw.measurements ?? undefined,
        photos: raw.photos ?? undefined,
        notes: raw.notes ?? undefined,
      };
    });

    return { success: true, data };
  } catch (err: any) {
    console.error('getProgressHistory error:', err);
    return { success: false, error: 'فشل جلب سجل التقدم.' };
  }
}