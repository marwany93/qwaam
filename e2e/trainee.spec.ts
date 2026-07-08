import { test, expect } from '@playwright/test';

// Project: `traineeA` — reuses trainee A's storageState (dietAdded + meal plan
// + active schedule). Feature smoke assertions live in the @smoke specs.

test.describe('Trainee dashboard', () => {
  test('lands on /client with the dashboard rendered', async ({ page }) => {
    await page.goto('/ar/client');
    await expect(page).toHaveURL(/\/ar\/client/);
    await expect(page.getByTestId('client-dashboard')).toBeVisible();
  });
});
