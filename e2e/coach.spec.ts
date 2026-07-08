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

    // The registration card + the onboarding data block render.
    await expect(page.getByTestId('coach-registration-card')).toBeVisible();
    const section = page.getByTestId('coach-onboarding-section');
    await expect(section).toBeVisible();

    // Representative values from the seeded trainee A onboarding object.
    await expect(page.getByTestId('onboarding-section-personal')).toBeVisible();
    await expect(page.getByTestId('onboarding-phone')).toContainText('01001234567');
    await expect(page.getByTestId('onboarding-maritalStatus')).toContainText('متزوجة');
    await expect(page.getByTestId('onboarding-primaryGoal')).toContainText('حرق الدهون');
    await expect(page.getByTestId('onboarding-workoutDaysPerWeek')).toContainText('4');
  });
});
