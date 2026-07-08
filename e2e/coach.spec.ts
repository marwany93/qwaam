import { test, expect } from '@playwright/test';
import { SEED } from './seed-data';

// Project: `coach` — reuses the coach storageState from global-setup.
// Default locale (ar) is unprefixed under next-intl localePrefix:'as-needed'.

const ADMIN_URL = /\/(?:ar\/)?admin(?:\/|\?|$)/;

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
});
