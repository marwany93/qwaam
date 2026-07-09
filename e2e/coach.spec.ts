import { test, expect } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SEED } from './seed-data';

// Project: `coach` — reuses the coach storageState from global-setup.
// Default locale (ar) is unprefixed under next-intl localePrefix:'as-needed'.

const ADMIN_URL = /\/(?:ar\/)?admin(?:\/|\?|$)/;

function adminDb() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'qwaam-test' });
  return getFirestore(app);
}

test.describe('Coach dashboard', () => {
  test('lands on /admin with the clients list rendered', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(ADMIN_URL);
    await expect(page.getByTestId('clients-list')).toBeVisible();
  });

  // Issue #2 — library: Exercises tab renders the muscle-grouped accordion
  test('@smoke library Exercises tab shows the muscle-grouped accordion', async ({ page }) => {
    await page.goto('/admin/library');
    // Exercises is the default tab; the browser (search + equipment filter + groups).
    await expect(page.getByTestId('exercise-accordion')).toBeVisible();
    await expect(page.getByPlaceholder(/بحث|Search/).first()).toBeVisible();
  });

  // Issue #6 — coach sees the trainee's full onboarding data on the detail page.
  test('@smoke trainee detail renders the onboarding registration data', async ({ page }) => {
    await page.goto(`/admin/client/${SEED.traineeA.uid}`);

    // The registration card renders; the onboarding block is collapsed by
    // default, so expand it via the header toggle first.
    await expect(page.getByTestId('coach-registration-card')).toBeVisible();
    const toggle = page.getByTestId('registration-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    const section = page.getByTestId('coach-onboarding-section');
    await expect(section).toBeVisible();

    // Representative values from the seeded trainee A onboarding object.
    await expect(page.getByTestId('onboarding-section-personal')).toBeVisible();
    await expect(page.getByTestId('onboarding-phone')).toContainText('01001234567');
    await expect(page.getByTestId('onboarding-maritalStatus')).toContainText('متزوجة');
    await expect(page.getByTestId('onboarding-primaryGoal')).toContainText('حرق الدهون');
    await expect(page.getByTestId('onboarding-workoutDaysPerWeek')).toContainText('4');
  });

  // Issue #7 — the add-exercise form is a catalog: only name/muscle/equipment/link.
  test('@smoke add-exercise form shows only the four kept catalog fields', async ({ page }) => {
    await page.goto('/admin/library');
    await page.getByRole('button', { name: /إضافة تمرين/ }).click();

    const form = page.getByTestId('exercise-form');
    await expect(form).toBeVisible();

    // Kept fields.
    await expect(form.getByText('اسم التمرين (عربي)')).toBeVisible();
    await expect(form.getByText('Exercise Name (English)')).toBeVisible();
    await expect(form.getByText('العضلة المستهدفة')).toBeVisible();
    await expect(form.getByText('المعدات المطلوبة')).toBeVisible();
    await expect(form.getByText(/رابط الفيديو/)).toBeVisible();

    // Removed training-default fields must be gone.
    await expect(form.getByText('عدد الجولات الافتراضي')).toHaveCount(0);
    await expect(form.getByText(/نطاق التكرارات/)).toHaveCount(0);
    await expect(form.getByText('مستوى الثقل الافتراضي')).toHaveCount(0);
    await expect(form.getByText(/وقت الراحة/)).toHaveCount(0);
  });

  // ── Issue #11 — coach schedule card (dates) instead of the session card ──────

  // (a) Duration schedule trainee → date card, NOT the session card / log button.
  test('@smoke duration schedule trainee shows the start/end date card, not sessions', async ({ page }) => {
    await page.goto(`/admin/client/${SEED.traineeA.uid}`);

    await expect(page.getByTestId('schedule-manager-card')).toBeVisible();
    await expect(page.getByTestId('schedule-start-date')).toBeVisible();
    await expect(page.getByTestId('schedule-end-date')).toBeVisible();

    // The session card and its "log session" button must be gone for schedule plans.
    await expect(page.getByText('متابعة الحصص')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /تسجيل حضور حصة/ })).toHaveCount(0);
  });

  // (b) Grandfathered schedule trainee (session model) → "no start" state, then
  // setting a date converts them to the duration model.
  test('@smoke grandfathered schedule trainee: set start date converts to duration', async ({ page }) => {
    await page.goto(`/admin/client/${SEED.traineeGF.uid}`);

    // Schedule plan but no start date → the "no start date" state + date control.
    await expect(page.getByTestId('schedule-manager-card')).toBeVisible();
    await expect(page.getByTestId('schedule-no-start')).toBeVisible();

    // Pick a real start date, save → confirm (conversion) → confirm.
    await page.getByTestId('schedule-date-input').fill('2026-07-01');
    await page.getByTestId('schedule-save-btn').click();
    await expect(page.getByTestId('schedule-confirm')).toBeVisible();
    await page.getByTestId('schedule-confirm-yes').click();

    // Card now shows the dates (period active).
    await expect(page.getByTestId('schedule-start-date')).toBeVisible({ timeout: 15_000 });

    // Firestore: converted to duration + anchored + session count zeroed.
    await expect
      .poll(async () => {
        const snap = await adminDb().collection('users').doc(SEED.traineeGF.uid).get();
        const sub = snap.data()?.traineeData?.subscription;
        return sub?.billingModel;
      }, { timeout: 15_000 })
      .toBe('duration');
    const snap = await adminDb().collection('users').doc(SEED.traineeGF.uid).get();
    const data = snap.data();
    expect(typeof data?.traineeData?.subscription?.scheduleStartAt).toBe('number');
    expect(typeof data?.traineeData?.subscription?.scheduleEndsAt).toBe('number');
    expect(data?.sessionTracking?.totalSessions).toBe(0);
    expect(data?.sessionTracking?.remainingSessions).toBe(0);
  });

  // (c) LIVE trainee → still the session card, unchanged.
  test('@smoke live trainee still shows the session card', async ({ page }) => {
    await page.goto(`/admin/client/${SEED.traineeLive.uid}`);

    await expect(page.getByText('متابعة الحصص')).toBeVisible();
    await expect(page.getByRole('button', { name: /تسجيل حضور حصة/ })).toBeVisible();
    await expect(page.getByTestId('schedule-manager-card')).toHaveCount(0);
  });
});
