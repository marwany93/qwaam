import { test, expect } from '@playwright/test';

// Project: `coach` — reuses the coach storageState from global-setup.

test.describe('Coach dashboard', () => {
  test('lands on /admin with the clients list rendered', async ({ page }) => {
    await page.goto('/ar/admin');
    await expect(page).toHaveURL(/\/ar\/admin/);
    await expect(page.getByTestId('clients-list')).toBeVisible();
  });
});
