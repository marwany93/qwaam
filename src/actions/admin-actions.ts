'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import type { QwaamUser } from '@/types';
import { revalidatePath } from 'next/cache';
import { notificationService } from '@/lib/notification-service';
import { FieldValue } from 'firebase-admin/firestore';
import { findPlanById } from '@/lib/pricing-config';

/**
 * Retrieves the list of all active trainees.
 * Only callable by authenticated coaches.
 */
export async function getClients(): Promise<QwaamUser[]> {
  await verifyAdminAccess();

  const db = getAdminDb();
  // Query users where role == 'trainee'
  const snapshot = await db.collection('users').where('role', '==', 'trainee').get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      // Admin SDK uses Firebase Admin Timestamp
      // Next.js requires plain objects to pass back to Server/Client Components
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    } as QwaamUser;
  });
}

/**
 * Adds a new trainee to the system.
 * Flow:
 * 1. Creates Firebase Auth user.
 * 2. Assigns `role: trainee` claim.
 * 3. Builds Firestore profile entry.
 * 4. Generates a password reset link for the coach to send to the trainee.
 */
export async function addClient(formData: FormData) {
  const decodedClaims = await verifyAdminAccess();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  // Optional: coach can seed an initial session count when adding a client
  // manually. Defaults to 0 — coach renews via the subscription panel later.
  const sessionsRaw = formData.get('sessions');
  const parsedSessions = sessionsRaw != null ? Number(sessionsRaw) : 0;
  const initialSessions = Number.isFinite(parsedSessions) && parsedSessions > 0 ? parsedSessions : 0;

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Create user in Firebase Auth
    // Auto-generate a complex random password since we'll send a password reset link
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!zQ';

    const userRecord = await auth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // 2. Set Custom Claim 'role: trainee'
    await auth.setCustomUserClaims(userRecord.uid, { role: 'trainee' });

    // 3. Create document in 'users' collection — sessionTracking is
    // initialized here so the document shape is consistent from day one.
    // Without this, manually-added clients had no sessionTracking field at
    // all, causing the dashboard widget to show stale/undefined values.
    await db.collection('users').doc(userRecord.uid).set({
      role: 'trainee',
      name,
      email,
      createdAt: new Date(),
      sessionTracking: {
        totalSessions: initialSessions,
        remainingSessions: initialSessions,
        planStatus: initialSessions > 0 ? 'active' : 'finished',
        lastRenewedAt: new Date(),
      },
      traineeData: {
        assignedCoachUid: decodedClaims.uid,
        assignedWorkouts: [],
        assignedMeals: [],
        progress: {}
      }
    });

    // 4. Generate the password reset email directly via Firebase Admin
    const resetLink = await auth.generatePasswordResetLink(email);
    console.log(`[QWAAM SERVICE] Sent reset link to trainee ${email}`);

    // Force Next.js to re-fetch the dashboard list on the next render
    revalidatePath('/admin'); 
    
    // Return the reset link so the Coach can copy it and send via WhatsApp!
    return { success: true, resetLink };

  } catch (error: any) {
    console.error('Error adding client:', error);
    // Return safe error messages
    const msg = error.code === 'auth/email-already-exists' 
      ? 'هذا البريد الإلكتروني مسجل مسبقاً.' 
      : 'حدث خطأ أثناء إضافة المتدرب.';
      
    return { error: msg };
  }
}

/**
 * Fetches all trainees.
 */
export async function getTrainees(): Promise<QwaamUser[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('users').where('role', '==', 'trainee').get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    } as QwaamUser;
  });
}

/**
 * Fetches all coaches. Returns minimal data for dropdowns.
 */
export async function getCoaches(): Promise<{ uid: string; name: string }[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('users').where('role', '==', 'coach').get();
  
  return snapshot.docs.map(doc => ({
    uid: doc.id,
    name: doc.data().name || 'Unnnamed Coach',
  }));
}

/**
 * Assigns a coach to a trainee.
 */
export async function assignCoach(traineeUid: string, coachUid: string) {
  await verifyAdminAccess();
  const db = getAdminDb();
  
  try {
    const batch = db.batch();
    const traineeRef = db.collection('users').doc(traineeUid);
    batch.update(traineeRef, {
      'traineeData.assignedCoachUid': coachUid
    });
    
    await batch.commit();

    // Revalidate the entire layout to ensure both Admin and Client routes are synced across any locale
    revalidatePath('/', 'layout');

    // Fetch details for the notification
    const [traineeDoc, coachDoc] = await Promise.all([
      traineeRef.get(),
      db.collection('users').doc(coachUid).get()
    ]);

    if (traineeDoc.exists && coachDoc.exists) {
      const traineeData = traineeDoc.data();
      const coachData = coachDoc.data();
      
      if (traineeData?.email && traineeData?.name && coachData?.name) {
        notificationService.notifyCoachAssigned(
          traineeData.email,
          traineeData.name,
          coachData.name
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error assigning coach:', error);
    return { error: 'Failed to assign coach' };
  }
}

/**
 * Deducts one session from a trainee's remaining sessions and logs the activity.
 */
export async function logTraineeSession(traineeUid: string, notes: string = '') {
  await verifyAdminAccess();
  const db = getAdminDb();

  try {
    const traineeRef = db.collection('users').doc(traineeUid);
    const traineeDoc = await traineeRef.get();

    if (!traineeDoc.exists) return { success: false, error: 'المتدرب غير موجود' };

    const remaining = traineeDoc.data()?.sessionTracking?.remainingSessions ?? 0;
    if (remaining <= 0) {
      return { success: false, error: 'رصيد الحصص نفذ، يرجى تجديد الباقة' };
    }

    // Use a transaction so the guard + decrement are atomic — no race condition
    // possible even if two coaches log a session at the exact same millisecond.
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(traineeRef);
      const currentRemaining = snap.data()?.sessionTracking?.remainingSessions ?? 0;

      if (currentRemaining <= 0) {
        throw new Error('NO_SESSIONS');
      }

      const newRemaining = currentRemaining - 1;
      tx.update(traineeRef, {
        'sessionTracking.remainingSessions': FieldValue.increment(-1),
        'sessionTracking.planStatus': newRemaining === 0 ? 'finished' : 'active',
      });

      // Log inside the same transaction for atomicity
      const logRef = db.collection('session_logs').doc();
      tx.set(logRef, {
        traineeUid,
        date: new Date(),
        notes,
        type: 'workout_session',
      });
    });

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true, remaining: remaining - 1 };
  } catch (error: any) {
    if (error?.message === 'NO_SESSIONS') {
      return { success: false, error: 'رصيد الحصص نفذ، يرجى تجديد الباقة' };
    }
    console.error('Error logging session:', error);
    return { success: false, error: 'حدث خطأ أثناء تسجيل الحصة' };
  }
}

/**
 * Adds sessions to a trainee's existing plan.
 * ADDS to current totals — does not override them.
 */
export async function renewTraineePlan(traineeUid: string, additionalSessions: number) {
  await verifyAdminAccess();
  const db = getAdminDb();

  try {
    const traineeRef = db.collection('users').doc(traineeUid);

    // Existence check first (cheap read), then atomic increments — no race condition.
    const snap = await traineeRef.get();
    if (!snap.exists) return { success: false, error: 'المتدرب غير موجود' };

    // FieldValue.increment is atomic: no read-modify-write race possible.
    await traineeRef.update({
      'sessionTracking.totalSessions':     FieldValue.increment(additionalSessions),
      'sessionTracking.remainingSessions': FieldValue.increment(additionalSessions),
      'sessionTracking.planStatus':        'active',
      'sessionTracking.lastRenewedAt':     new Date(),
      'renewalRequest.status':             'fulfilled',
    });

    // Read the updated totals back for the UI response (single additional read, safe)
    const updated = (await traineeRef.get()).data()?.sessionTracking;
    const newTotal     = updated?.totalSessions     ?? additionalSessions;
    const newRemaining = updated?.remainingSessions ?? additionalSessions;

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true, newTotal, newRemaining };
  } catch (error) {
    console.error('Error renewing plan:', error);
    return { success: false, error: 'حدث خطأ أثناء تجديد الباقة' };
  }
}

/**
 * Manual DB override — sets exact values regardless of current state.
 * Used by the admin Danger Zone only.
 */
export async function overrideTraineeSessions(
  traineeUid: string,
  totalSessions: number,
  remainingSessions: number,
) {
  await verifyAdminAccess();

  if (remainingSessions > totalSessions) {
    return { success: false, error: 'الحصص المتبقية لا يمكن أن تتجاوز الإجمالي.' };
  }

  const db = getAdminDb();
  try {
    await db.collection('users').doc(traineeUid).update({
      'sessionTracking.totalSessions':     totalSessions,
      'sessionTracking.remainingSessions': remainingSessions,
      'sessionTracking.planStatus':        remainingSessions <= 0 ? 'finished' : 'active',
    });

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true };
  } catch (error) {
    console.error('Error overriding sessions:', error);
    return { success: false, error: 'حدث خطأ أثناء التعديل اليدوي' };
  }
}

/**
 * Sets activeRoomUrl on the trainee's document so the trainee sees the "Join" button.
 */
export async function startLiveSession(traineeUid: string, roomName: string) {
  await verifyAdminAccess();
  const db = getAdminDb();
  try {
    await db.collection('users').doc(traineeUid).update({ activeRoomUrl: roomName });
    return { success: true };
  } catch (error) {
    console.error('startLiveSession error:', error);
    return { success: false, error: 'فشل بدء الحصة المباشرة' };
  }
}

/**
 * Called when the admin leaves the ZegoCloud call.
 * Deducts 1 session and clears the activeRoomUrl so the trainee's join button disappears.
 */
export async function endLiveSession(traineeUid: string) {
  await verifyAdminAccess();
  const db = getAdminDb();
  try {
    const traineeRef = db.collection('users').doc(traineeUid);

    // Use a transaction: guard against going below 0, decrement atomically,
    // and update planStatus in a single consistent write.
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(traineeRef);
      if (!snap.exists) throw new Error('NOT_FOUND');

      const currentRemaining = snap.data()?.sessionTracking?.remainingSessions ?? 0;
      const newRemaining = Math.max(0, currentRemaining - 1);

      tx.update(traineeRef, {
        activeRoomUrl: null,
        'sessionTracking.remainingSessions': FieldValue.increment(currentRemaining > 0 ? -1 : 0),
        'sessionTracking.planStatus': newRemaining === 0 ? 'finished' : 'active',
      });

      // Log inside the transaction for atomicity
      const logRef = db.collection('session_logs').doc();
      tx.set(logRef, {
        traineeUid,
        date: new Date(),
        notes: 'حصة لايف مباشرة عبر ZegoCloud',
        type: 'live_session',
      });
    });

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true };
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') {
      return { success: false, error: 'المتدرب غير موجود' };
    }
    console.error('endLiveSession error:', error);
    return { success: false, error: 'فشل إنهاء الحصة' };
  }
}

/**
 * Saves a Spoonacular recipe into our own `custom_meals` collection
 * so coaches can reuse it in meal plans without re-burning API quota.
 * Idempotent on (savedByCoachUid, sourceId) — calling twice updates
 * rather than duplicating.
 */
export interface SaveMealPayload {
  sourceId: number;            // Spoonacular recipe id
  title: string;
  image?: string | null;
  sourceUrl?: string | null;
  calories?: number | null;
  protein?: number | null;     // grams
  carbs?: number | null;       // grams
  fat?: number | null;         // grams
}

export async function saveSpoonacularMealToDb(mealData: SaveMealPayload) {
  const decoded = await verifyAdminAccess();

  if (!mealData?.sourceId || !mealData?.title) {
    return { success: false, error: 'بيانات الوجبة غير مكتملة.' };
  }

  const db = getAdminDb();
  // Deterministic doc id: scoped per coach so two coaches can independently save
  // the same Spoonacular recipe without colliding.
  const docId = `spoon_${decoded.uid}_${mealData.sourceId}`;

  try {
    await db.collection('custom_meals').doc(docId).set(
      {
        source: 'spoonacular',
        sourceId: mealData.sourceId,
        sourceUrl: mealData.sourceUrl ?? null,
        title: mealData.title,
        image: mealData.image ?? null,
        calories: mealData.calories ?? null,
        macros: {
          protein: mealData.protein ?? null,
          carbs:   mealData.carbs   ?? null,
          fat:     mealData.fat     ?? null,
        },
        savedByCoachUid: decoded.uid,
        savedAt: new Date(),
      },
      { merge: true },
    );

    revalidatePath('/admin/library');
    return { success: true };
  } catch (error) {
    console.error('saveSpoonacularMealToDb error:', error);
    return { success: false, error: 'فشل حفظ الوجبة.' };
  }
}

export interface SavedMeal {
  id: string;
  source: 'spoonacular' | 'custom';
  sourceId?: number;
  sourceUrl?: string | null;
  title: string;
  image?: string | null;
  calories?: number | null;
  macros: { protein: number | null; carbs: number | null; fat: number | null };
  savedAt: number;
}

/**
 * Returns the current coach's saved meals (newest first).
 */
export async function getSavedMeals(): Promise<{ success: boolean; data?: SavedMeal[]; error?: string }> {
  const decoded = await verifyAdminAccess();
  const db = getAdminDb();

  try {
    const snap = await db
      .collection('custom_meals')
      .where('savedByCoachUid', '==', decoded.uid)
      .orderBy('savedAt', 'desc')
      .get();

    const data: SavedMeal[] = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        source: raw.source ?? 'custom',
        sourceId: raw.sourceId ?? undefined,
        sourceUrl: raw.sourceUrl ?? null,
        title: raw.title ?? '',
        image: raw.image ?? null,
        calories: raw.calories ?? null,
        macros: {
          protein: raw.macros?.protein ?? null,
          carbs:   raw.macros?.carbs   ?? null,
          fat:     raw.macros?.fat     ?? null,
        },
        savedAt: raw.savedAt?.toMillis ? raw.savedAt.toMillis() : Date.now(),
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('getSavedMeals error:', error);
    // Common cause: missing composite index on (savedByCoachUid ASC, savedAt DESC)
    return { success: false, error: 'فشل جلب الوجبات المحفوظة.' };
  }
}

/**
 * Deletes one saved meal. Verifies the doc belongs to the calling coach
 * so a coach cannot delete another coach's saved recipes.
 */
export async function deleteSavedMeal(docId: string) {
  const decoded = await verifyAdminAccess();
  if (!docId) return { success: false, error: 'معرّف الوجبة مطلوب.' };

  const db = getAdminDb();
  try {
    const ref = db.collection('custom_meals').doc(docId);
    const snap = await ref.get();

    if (!snap.exists) return { success: false, error: 'الوجبة غير موجودة.' };
    if (snap.data()?.savedByCoachUid !== decoded.uid) {
      return { success: false, error: 'غير مصرّح لك بحذف هذه الوجبة.' };
    }

    await ref.delete();
    revalidatePath('/admin/library');
    return { success: true };
  } catch (error) {
    console.error('deleteSavedMeal error:', error);
    return { success: false, error: 'فشل حذف الوجبة.' };
  }
}

/**
 * ⚠️ ONE-SHOT RECOVERY ACTION — remove after the admin claim is patched.
 *
 * Forces the custom claim `{ role: 'coach' }` onto the Firebase Auth user
 * identified by `email`. Used to fix accounts that have `role: admin` in
 * Firestore but a stale/missing custom claim on the JWT — the security
 * rules check the JWT (`request.auth.token.role`), not the Firestore doc,
 * so the user gets permission-denied until the claim is re-minted.
 *
 * After running:
 *   1. The target user must sign out and sign back in (or force a token
 *      refresh client-side via getIdToken(true)) for the new claim to
 *      appear on their ID token.
 *   2. DELETE this action and its UI trigger.
 *
 * Intentionally NOT gated by verifyAdminAccess — the whole reason this
 * exists is to bootstrap an admin who currently cannot pass that check.
 * Instead it allowlists a single hardcoded email so it can't be abused.
 */
const ADMIN_BOOTSTRAP_EMAILS = new Set(['coach@qwaam.com']);

export async function fixAdminPermissions(email: string) {
  try {
    if (!email || !ADMIN_BOOTSTRAP_EMAILS.has(email.trim().toLowerCase())) {
      return { success: false, error: 'البريد غير مسموح به لهذه العملية.' };
    }

    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email);

    await auth.setCustomUserClaims(userRecord.uid, { role: 'coach' });

    // Mirror to Firestore for the self-healing flow in verifyClientAccess
    // and so any code reading the doc sees a consistent role.
    const db = getAdminDb();
    await db.collection('users').doc(userRecord.uid).set(
      { role: 'coach' },
      { merge: true },
    );

    console.warn(`[fixAdminPermissions] Set role:coach claim on ${email} (uid: ${userRecord.uid})`);
    return {
      success: true,
      uid: userRecord.uid,
      message: 'تم تحديث الصلاحيات. سجّل خروج ثم دخول مجدداً لتطبيق التغيير.',
    };
  } catch (error: any) {
    console.error('fixAdminPermissions error:', error);
    const msg = error?.code === 'auth/user-not-found'
      ? 'لم يتم العثور على حساب بهذا البريد.'
      : 'فشلت العملية.';
    return { success: false, error: msg };
  }
}

/**
 * Activates a trainee's subscription after the admin has verified payment
 * (e.g., InstaPay/wallet transfer). Optionally swaps the plan first if the
 * coach picked a different one in the UI before confirming.
 *
 * Side effects:
 *   - subscription.status -> 'active'
 *   - subscription.planId / amountPaid updated if updatedPlanId provided
 *   - sessionTracking initialized from the (possibly new) plan so the
 *     totals match what the trainee actually paid for
 */
export async function confirmTraineePayment(traineeUid: string, updatedPlanId?: string) {
  await verifyAdminAccess();
  if (!traineeUid) return { success: false, error: 'معرّف المتدرب مطلوب.' };

  const db = getAdminDb();
  try {
    const traineeRef = db.collection('users').doc(traineeUid);
    const snap = await traineeRef.get();
    if (!snap.exists) return { success: false, error: 'المتدرب غير موجود.' };

    const data = snap.data() ?? {};
    const currentSub = data.traineeData?.subscription ?? null;

    // Resolve which plan to activate: explicit override > current subscription's plan
    const effectivePlanId: string | undefined = updatedPlanId || currentSub?.planId;
    if (!effectivePlanId) {
      return { success: false, error: 'لم يتم تحديد باقة للمتدرب.' };
    }

    const plan = findPlanById(effectivePlanId);
    if (!plan) {
      return { success: false, error: 'الباقة المختارة غير صالحة.' };
    }

    // Live plans use `sessions`; schedule plans fall back to `days` per week
    // as a sensible initial session budget for the cycle.
    const initialSessions = plan.sessions ?? plan.days ?? 0;

    // Build update payload. Always set status + sessionTracking; only
    // overwrite planId/amountPaid if the admin chose a different plan.
    const update: Record<string, any> = {
      'traineeData.subscription.status': 'active',
      'traineeData.subscription.activatedAt': new Date(),
      'sessionTracking.totalSessions': initialSessions,
      'sessionTracking.remainingSessions': initialSessions,
      'sessionTracking.planStatus': initialSessions > 0 ? 'active' : 'finished',
      'sessionTracking.lastRenewedAt': new Date(),
    };

    if (updatedPlanId && updatedPlanId !== currentSub?.planId) {
      update['traineeData.subscription.planId'] = updatedPlanId;
      update['traineeData.subscription.amountPaid'] = String(plan.price);
    }

    await traineeRef.update(update);

    // Refresh both the admin detail page and the trainee's own dashboard
    revalidatePath(`/admin/client/${traineeUid}`);
    revalidatePath('/client');

    return {
      success: true,
      planId: effectivePlanId,
      sessions: initialSessions,
    };
  } catch (error) {
    console.error('confirmTraineePayment error:', error);
    return { success: false, error: 'فشل تأكيد الدفع.' };
  }
}
