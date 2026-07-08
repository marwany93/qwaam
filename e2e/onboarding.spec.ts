import { test, expect } from '@playwright/test';

// Project: `onboarding` — public, no stored session.
// Issue #5 smoke: the "trained before?" question renders in Step 4 and its
// optional guide-photo uploader appears only when the answer is "yes".

test.describe('Onboarding — trained-before question', () => {
  test('@smoke question renders and toggles the optional uploader', async ({ page }) => {
    await page.goto('/onboarding');

    // ── Step 1: email (unique so the emulator existence check passes) ──
    const email = `smoke_${Date.now()}@example.com`;
    await page.locator('input[type="email"]').fill(email);
    await page.getByRole('button', { name: /التالي/ }).click();

    // ── Step 2: personal info ──
    const dob = page.locator('input[type="date"]');
    await expect(dob).toBeVisible();
    await page.locator('input[type="text"]').first().fill('سمكة تجريبية');
    await dob.fill('1995-05-15');
    await page.locator('input[type="tel"]').fill('01000000000');
    await page.getByRole('button', { name: /التالي/ }).click();

    // ── Step 3: health — defaults (all "no") are valid, just advance ──
    await page.getByRole('button', { name: /التالي/ }).click();

    // ── Step 4: the trained-before question is present ──
    const question = page.getByTestId('trained-before-question');
    await expect(question).toBeVisible();

    // No uploader until the answer is "yes"
    await expect(page.getByTestId('previous-guides-uploader')).toHaveCount(0);

    // "Yes" → the optional multi-photo uploader appears
    await page.getByTestId('trained-before-yes').click();
    await expect(page.getByTestId('previous-guides-uploader')).toBeVisible();

    // "No" → the uploader disappears again
    await page.getByTestId('trained-before-no').click();
    await expect(page.getByTestId('previous-guides-uploader')).toHaveCount(0);
  });
});
