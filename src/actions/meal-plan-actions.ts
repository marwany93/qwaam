'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import type { MealPlan, MealPlanDay } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Sums calories across every meal in every day. Done server-side so the
 * client cannot inflate the total by tampering with the request payload.
 */
function computeTotalCalories(days: MealPlanDay[]): number {
  return days.reduce(
    (sum, d) => sum + (d.meals?.reduce((s, m) => s + (Number(m.calories) || 0), 0) ?? 0),
    0,
  );
}

/**
 * Lightweight validator — rejects obviously malformed payloads before any
 * Firestore write. Returns null on success, an error string on failure.
 */
function validatePlanPayload(data: { name?: string; days?: MealPlanDay[] }): string | null {
  if (!data?.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return 'يرجى تعبئة اسم الخطة الغذائية.';
  }
  if (!Array.isArray(data.days) || data.days.length === 0) {
    return 'يجب أن تحتوي الخطة على يوم واحد على الأقل.';
  }
  for (const day of data.days) {
    if (!day?.dayName || !Array.isArray(day.meals)) {
      return 'بنية الأيام غير صحيحة.';
    }
    for (const m of day.meals) {
      if (!m?.savedMealId || !m?.mealType || !m?.mealName) {
        return 'كل وجبة يجب أن تحتوي على نوع، اسم، ومرجع للوجبة المحفوظة.';
      }
    }
  }
  return null;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

// assignedTo is passed as a separate function parameter (traineeUid), not
// inside the data payload — keeps the call site explicit about WHO the
// plan is for. coachUid + createdAt + totalCalories are all server-derived.
export type CreateMealPlanInput = Omit<
  MealPlan,
  'id' | 'coachUid' | 'createdAt' | 'totalCalories' | 'assignedTo'
> & {
  totalCalories?: number; // ignored — recomputed on the server
};

/**
 * Creates a new meal plan for the current coach. totalCalories is computed
 * server-side from `days` so client tampering is impossible.
 *
 * `traineeUid` is required and written as `assignedTo` so the hardened
 * Firestore Rules can grant that specific trainee read access via
 * `resource.data.assignedTo == request.auth.uid`. Without it, the trainee's
 * client SDK queries would be denied.
 */
export async function createMealPlan(
  data: CreateMealPlanInput,
  traineeUid: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const decoded = await verifyAdminAccess();

  if (!traineeUid || typeof traineeUid !== 'string') {
    return { success: false, error: 'يجب تعيين الخطة لمتدرّبة محددة.' };
  }

  const validationError = validatePlanPayload(data);
  if (validationError) return { success: false, error: validationError };

  const db = getAdminDb();
  try {
    // Defense-in-depth: verify the target trainee actually exists and is owned
    // by this coach. Stops a malicious request from assigning plans to
    // arbitrary user ids.
    const traineeSnap = await db.collection('users').doc(traineeUid).get();
    if (!traineeSnap.exists) {
      return { success: false, error: 'المتدرّبة غير موجودة.' };
    }
    const traineeData = traineeSnap.data();
    if (traineeData?.role !== 'trainee') {
      return { success: false, error: 'الحساب المختار ليس متدرّباً.' };
    }
    if (traineeData?.traineeData?.assignedCoachUid !== decoded.uid) {
      return { success: false, error: 'غير مصرّح لك بإسناد خطة لهذه المتدرّبة.' };
    }

    const totalCalories = computeTotalCalories(data.days);

    const doc = await db.collection('meal_plans').add({
      coachUid: decoded.uid,
      assignedTo: traineeUid,        // required by hardened rules for trainee reads
      name: data.name.trim(),
      description: data.description?.trim() || '',
      days: data.days,
      totalCalories,
      createdAt: new Date(),
    });

    revalidatePath('/admin/library');
    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true, id: doc.id };
  } catch (error) {
    console.error('createMealPlan error:', error);
    return { success: false, error: 'فشل إنشاء الخطة الغذائية.' };
  }
}

/**
 * Lists the current coach's meal plans, newest first.
 * Requires composite index: (coachUid ASC, createdAt DESC) on meal_plans.
 */
export async function getMealPlans(): Promise<{ success: boolean; data?: MealPlan[]; error?: string }> {
  const decoded = await verifyAdminAccess();
  const db = getAdminDb();

  try {
    const snap = await db
      .collection('meal_plans')
      .where('coachUid', '==', decoded.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const data: MealPlan[] = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        coachUid: raw.coachUid,
        assignedTo: raw.assignedTo ?? '',
        name: raw.name ?? '',
        description: raw.description ?? '',
        days: Array.isArray(raw.days) ? raw.days : [],
        totalCalories: typeof raw.totalCalories === 'number' ? raw.totalCalories : 0,
        createdAt: raw.createdAt?.toMillis ? raw.createdAt.toMillis() : Date.now(),
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error('getMealPlans error:', error);
    return { success: false, error: 'فشل جلب الخطط الغذائية.' };
  }
}

/**
 * Deletes a meal plan, but only if the calling coach owns it.
 * Defense in depth — even if a coach guesses a doc id, we re-check ownership.
 */
export async function deleteMealPlan(
  planId: string,
): Promise<{ success: boolean; error?: string }> {
  const decoded = await verifyAdminAccess();
  if (!planId) return { success: false, error: 'معرّف الخطة مطلوب.' };

  const db = getAdminDb();
  try {
    const ref = db.collection('meal_plans').doc(planId);
    const snap = await ref.get();

    if (!snap.exists) return { success: false, error: 'الخطة غير موجودة.' };
    if (snap.data()?.coachUid !== decoded.uid) {
      return { success: false, error: 'غير مصرّح لك بحذف هذه الخطة.' };
    }

    await ref.delete();
    revalidatePath('/admin/library');
    return { success: true };
  } catch (error) {
    console.error('deleteMealPlan error:', error);
    return { success: false, error: 'فشل حذف الخطة.' };
  }
}
