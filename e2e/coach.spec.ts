import { test, expect } from '@playwright/test';

// Project: `coach` — reuses the coach storageState from global-setup.

test.describe('Coach dashboard', () => {
  test('lands on /admin with the clients list rendered', async ({ page }) => {
    await page.goto('/ar/admin');
    await expect(page).toHaveURL(/\/ar\/admin/);
    await expect(page.getByTestId('clients-list')).toBeVisible();
  });

  // Issue #2 — library: Exercises tab renders the muscle-grouped accordion
  test('@smoke library Exercises tab shows the muscle-grouped accordion', async ({ page }) => {
    await page.goto('/ar/admin/library');
    // Exercises is the default tab; the browser (search + equipment filter + groups).
    await expect(page.getByTestId('exercise-accordion')).toBeVisible();
    await expect(page.getByPlaceholder(/بحث|Search/).first()).toBeVisible();
  });
});
