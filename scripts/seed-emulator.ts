/**
 * Emulator seed — deterministic test data for the Playwright e2e suite.
 * ─────────────────────────────────────────────────────────────────────
 * SAFETY: this script REFUSES to run unless the Firebase emulator host env
 * vars are present (they are injected by `firebase emulators:exec`). It inits
 * the Admin SDK with a dummy projectId ONLY — it never reads, loads, or touches
 * `firebase-key.json` or any real service-account credential, so it can never
 * mutate the production project.
 *
 * Run via:  npm run seed:emulator   (inside `firebase emulators:exec`)
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { addOneMonth } from '../src/lib/date-utils';

// ── Hard safety gate ────────────────────────────────────────────────────────
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST;
if (!AUTH_HOST || !FS_HOST) {
  console.error(
    '\n[seed] REFUSING TO RUN: FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST ' +
      'must both be set (they are injected by `firebase emulators:exec`).\n' +
      'This guard guarantees the seed can never touch the real Firebase project.\n',
  );
  process.exit(1);
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'qwaam-test';
const PASSWORD = 'Test123!';

// Deterministic identities the Playwright specs rely on.
export const SEED = {
  coach: { uid: 'coach-e2e', email: 'coach@qwaam.test' },
  traineeA: { uid: 'trainee-a-e2e', email: 'traineeA@qwaam.test' },
  traineeB: { uid: 'trainee-b-e2e', email: 'traineeB@qwaam.test' },
  password: PASSWORD,
};

const app = getApps().length ? getApps()[0] : initializeApp({ projectId: PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

/** Create (or reset) an Auth user with a fixed uid + role custom claim. */
async function upsertUser(uid: string, email: string, role: 'coach' | 'trainee') {
  try {
    await auth.deleteUser(uid);
  } catch {
    /* not found — first run */
  }
  await auth.createUser({ uid, email, password: PASSWORD, emailVerified: true });
  await auth.setCustomUserClaims(uid, { role });
}

async function main() {
  console.log(`[seed] emulator project="${PROJECT_ID}" auth=${AUTH_HOST} firestore=${FS_HOST}`);

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // ── Auth users + claims ───────────────────────────────────────────────────
  await upsertUser(SEED.coach.uid, SEED.coach.email, 'coach');
  await upsertUser(SEED.traineeA.uid, SEED.traineeA.email, 'trainee');
  await upsertUser(SEED.traineeB.uid, SEED.traineeB.email, 'trainee');

  // ── Coach doc ─────────────────────────────────────────────────────────────
  await db.collection('users').doc(SEED.coach.uid).set({
    uid: SEED.coach.uid,
    role: 'coach',
    name: 'كوتش الاختبار',
    email: SEED.coach.email,
    createdAt: FieldValue.serverTimestamp(),
  });

  // ── Trainee A — duration schedule, active, dietAdded=true ─────────────────
  await db.collection('users').doc(SEED.traineeA.uid).set({
    uid: SEED.traineeA.uid,
    role: 'trainee',
    name: 'متدربة أ',
    email: SEED.traineeA.email,
    createdAt: FieldValue.serverTimestamp(),
    sessionTracking: { totalSessions: 0, remainingSessions: 0, planStatus: 'active' },
    traineeData: {
      assignedCoachUid: SEED.coach.uid,
      assignedWorkouts: [],
      assignedMeals: [],
      subscription: {
        planId: 'home-sched-4',
        amountPaid: '350',
        dietAdded: true,
        status: 'active',
        createdAt: nowIso,
        activatedAt: now,
        billingModel: 'duration',
        scheduleStartAt: now,
        scheduleEndsAt: addOneMonth(now),
        renewalReminderSentAt: null,
      },
    },
  });

  // ── Trainee B — dietAdded=false (nutrition locked-state test) ─────────────
  await db.collection('users').doc(SEED.traineeB.uid).set({
    uid: SEED.traineeB.uid,
    role: 'trainee',
    name: 'متدربة ب',
    email: SEED.traineeB.email,
    createdAt: FieldValue.serverTimestamp(),
    sessionTracking: { totalSessions: 0, remainingSessions: 0, planStatus: 'active' },
    traineeData: {
      assignedCoachUid: SEED.coach.uid,
      assignedWorkouts: [],
      assignedMeals: [],
      subscription: {
        planId: 'gym-sched-4',
        amountPaid: '250',
        dietAdded: false,
        status: 'active',
        createdAt: nowIso,
        activatedAt: now,
        billingModel: 'duration',
        scheduleStartAt: now,
        scheduleEndsAt: addOneMonth(now),
        renewalReminderSentAt: null,
      },
    },
  });

  // ── Meal plan for trainee A (single day, full macros, eating window) ──────
  const rows = [
    { id: 'row_seed_bf', mealType: 'breakfast', description: '3 بيضات مسلوقة + شريحة توست أسمر', calories: 320, protein: 24, carbs: 22, fats: 14, source: 'manual' },
    { id: 'row_seed_dn', mealType: 'dinner', description: '150جم صدور فراخ مشوية + أرز + سلطة', calories: 520, protein: 45, carbs: 48, fats: 12, source: 'manual' },
  ];
  const totalCalories = rows.reduce((s, r) => s + r.calories, 0);
  await db.collection('meal_plans').doc('plan-a-e2e').set({
    coachUid: SEED.coach.uid,
    assignedTo: SEED.traineeA.uid,
    name: 'خطة الاختبار — يوم واحد',
    description: 'خطة seed للـ e2e',
    days: [{ dayName: 'اليوم 1', meals: rows }],
    totalCalories,
    eatingWindow: { start: '12:00', end: '20:00' },
    createdAt: FieldValue.serverTimestamp(),
  });

  // ── A few exercises across muscle groups (library accordion) ──────────────
  const exercises = [
    { nameAr: 'ضغط الصدر بالبار', nameEn: 'Barbell Bench Press', targetMuscle: 'Chest', equipment: 'Barbell' },
    { nameAr: 'سكوات بالبار', nameEn: 'Barbell Squat', targetMuscle: 'Quadriceps', equipment: 'Barbell' },
    { nameAr: 'مرجحة الدمبل للبايسبس', nameEn: 'Dumbbell Biceps Curl', targetMuscle: 'Biceps', equipment: 'Dumbbell' },
  ];
  for (let i = 0; i < exercises.length; i++) {
    await db.collection('exercises').doc(`ex-e2e-${i}`).set({
      ...exercises[i],
      defaultSets: 3,
      defaultReps: '10-12',
      defaultWeightLevel: 'medium',
      defaultRest: 60,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  console.log('[seed] done — 1 coach, 2 trainees, 1 meal_plan, 3 exercises.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  });
