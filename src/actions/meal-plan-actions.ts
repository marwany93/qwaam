'use server';

import { randomUUID } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess, verifyClientAccess } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import type { MealPlan, MealPlanDay, MealPlanMealRow, MealType } from '@/types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Normalizes every meal row before persisting:
 *  - assigns a stable `id` once (keeps any existing id so it survives edits/reorders),
 *  - coerces macros to non-negative numbers,
 *  - maps a singular `fat` (legacy/Spoonacular boundary) → canonical `fats`,
 *  - drops the legacy `mealName` in favor of `description`.
 * Client-supplied ids are treated as untrusted labels, so we only KEEP them when
 * they look like ones we minted (prefixed) — otherwise mint a fresh uuid.
 */
function normalizeDaysForWrite(days: MealPlanDay[]): MealPlanDay[] {
  return days.map((day) => ({
    dayName: String(day.dayName || '').trim() || 'اليوم',
    meals: (day.meals ?? []).map((raw: any): MealPlanMealRow => {
      const keepId = typeof raw?.id === 'string' && raw.id.startsWith('row_');
      const fats = raw?.fats != null ? raw.fats : raw?.fat; // fat → fats at the boundary
      return {
        id: keepId ? raw.id : `row_${randomUUID()}`,
        mealType: MEAL_TYPES.includes(raw?.mealType) ? raw.mealType : 'snack',
        description: String(raw?.description ?? raw?.mealName ?? '').trim(),
        calories: toNum(raw?.calories),
        protein: toNum(raw?.protein),
        carbs: toNum(raw?.carbs),
        fats: toNum(fats),
        source: (['manual', 'spoonacular', 'library'] as const).includes(raw?.source)
          ? raw.source
          : 'manual',
        ...(raw?.savedMealId ? { savedMealId: String(raw.savedMealId) } : {}),
      };
    }),
  }));
}

/** "HH:MM" 24-hour validator for eating-window inputs. */
function isHHMM(v: unknown): v is string {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

/**
 * Lightweight validator — rejects obviously malformed payloads before any
 * Firestore write. Returns null on success, an error string on failure.
 */
function validatePlanPayload(data: {
  name?: string;
  days?: MealPlanDay[];
  eatingWindow?: { start: string; end: string } | null;
}): string | null {
  if (!data?.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return 'يرجى تعبئة اسم الخطة الغذائية.';
  }
  if (!Array.isArray(data.days) || data.days.length === 0) {
    return 'يجب أن تحتوي الخطة على يوم واحد على الأقل.';
  }
  for (const day of data.days) {
    if (!day?.dayName || !Array.isArray(day.meals) || day.meals.length === 0) {
      return 'كل يوم يجب أن يحتوي على وجبة واحدة على الأقل.';
    }
    for (const m of day.meals) {
      if (!m?.mealType || !String(m?.description ?? m?.mealName ?? '').trim()) {
        return 'كل وجبة يجب أن تحتوي على نوع ووصف.';
      }
    }
  }
  if (data.eatingWindow != null) {
    if (!isHHMM(data.eatingWindow.start) || !isHHMM(data.eatingWindow.end)) {
      return 'نافذة الأكل غير صحيحة (استخدم صيغة الوقت 24 ساعة).';
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

// eatingWindow is part of MealPlan (and thus CreateMealPlanInput). We normalize
// it to null when absent so Firestore never stores `undefined`.
function normalizeEatingWindow(
  win: { start: string; end: string } | null | undefined,
): { start: string; end: string } | null {
  if (win && isHHMM(win.start) && isHHMM(win.end)) {
    return { start: win.start, end: win.end };
  }
  return null;
}

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

    const days = normalizeDaysForWrite(data.days);
    const totalCalories = computeTotalCalories(days);
    const eatingWindow = normalizeEatingWindow(data.eatingWindow);

    const doc = await db.collection('meal_plans').add({
      coachUid: decoded.uid,
      assignedTo: traineeUid,        // required by hardened rules for trainee reads
      name: data.name.trim(),
      description: data.description?.trim() || '',
      days,
      totalCalories,
      eatingWindow,
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
        eatingWindow: raw.eatingWindow ?? null,
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
 * Client read path (Path B). Returns the trainee's most-recent assigned meal
 * plan — GATED behind the +200 EGP nutrition add-on (`subscription.dietAdded`).
 *
 * Enforcement point #1 of 2 (the Diet Module render is #2): when `dietAdded`
 * is false we return `{ dietAdded: false, plan: null }` WITHOUT ever querying
 * meal_plans, so a locked trainee's plan never leaves the server.
 *
 * `traineeUid` is accepted for symmetry but the trainee may only read their own
 * plan — we always key the query off the verified session uid, never the arg.
 */
export async function getAssignedMealPlan(
  _traineeUid?: string,
): Promise<{ dietAdded: boolean; plan: MealPlan | null }> {
  const decoded = await verifyClientAccess();
  const db = getAdminDb();

  try {
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const dietAdded =
      userSnap.data()?.traineeData?.subscription?.dietAdded === true;

    // Gate: no add-on → never touch meal_plans.
    if (!dietAdded) return { dietAdded: false, plan: null };

    const snap = await db
      .collection('meal_plans')
      .where('assignedTo', '==', decoded.uid)
      .get();

    if (snap.empty) return { dietAdded: true, plan: null };

    // Newest first — sorted in memory to avoid needing a composite index and
    // to tolerate legacy docs whose createdAt may be missing.
    const plans: MealPlan[] = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        coachUid: raw.coachUid,
        assignedTo: raw.assignedTo ?? '',
        name: raw.name ?? '',
        description: raw.description ?? '',
        days: Array.isArray(raw.days) ? raw.days : [],
        totalCalories: typeof raw.totalCalories === 'number' ? raw.totalCalories : 0,
        eatingWindow: raw.eatingWindow ?? null,
        createdAt: raw.createdAt?.toMillis ? raw.createdAt.toMillis() : 0,
      };
    });
    plans.sort((a, b) => b.createdAt - a.createdAt);

    return { dietAdded: true, plan: plans[0] ?? null };
  } catch (error) {
    console.error('getAssignedMealPlan error:', error);
    // Fail closed — treat as "no plan" rather than leaking a partial/locked view.
    return { dietAdded: false, plan: null };
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
