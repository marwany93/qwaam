import { test, expect } from '@playwright/test';

// Project: `traineeA` — reuses trainee A's storageState (dietAdded + meal plan
// + active schedule). Feature smoke assertions live in the @smoke specs.
// Default locale (ar) is unprefixed under next-intl localePrefix:'as-needed'.

const CLIENT_URL = /\/(?:ar\/)?client(?:\/|\?|$)/;

test.describe('Trainee dashboard', () => {
  test('lands on /client with the dashboard rendered', async ({ page }) => {
    await page.goto('/client');
    await expect(page).toHaveURL(CLIENT_URL);
    await expect(page.getByTestId('client-dashboard')).toBeVisible();
  });

  // Issue #3 — nutrition: dietAdded + assigned meal plan → table with daily total
  test('@smoke shows the meal-plan table with a daily total', async ({ page }) => {
    await page.goto('/client');
    await expect(page.getByTestId('meal-plan-table')).toBeVisible();
    await expect(page.getByTestId('meal-daily-total').first()).toBeVisible();
    // Locked state must NOT appear for a dietAdded trainee with a plan.
    await expect(page.getByTestId('nutrition-locked')).toHaveCount(0);
  });

  // Issue #1 — schedule: active duration plan → ScheduleStatusCard with dates
  test('@smoke shows the schedule status card', async ({ page }) => {
    await page.goto('/client');
    await expect(page.getByTestId('schedule-status-card')).toBeVisible();
  });
});
