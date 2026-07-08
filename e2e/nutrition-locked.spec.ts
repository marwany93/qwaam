import { test, expect } from '@playwright/test';

// Project: `traineeB` — reuses trainee B's storageState (dietAdded=false).
// Issue #3 nutrition gate: the locked/upsell state shows, never a meal plan.

test.describe('Nutrition gate (locked)', () => {
  test('@smoke trainee without the add-on sees the locked state, not a plan', async ({ page }) => {
    await page.goto('/ar/client');
    await expect(page.getByTestId('nutrition-locked')).toBeVisible();
    await expect(page.getByTestId('meal-plan-table')).toHaveCount(0);
  });
});
