import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should redirect unauthenticated users to login from admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login.*/);
  });

  // ── BLUEPRINT TESTS ─────────────────────────────────────────────────────────
  // These tests require a valid Firebase Session Cookie or Emulator to pass.
  // They serve as structural blueprints for the expected DOM interactions.

  test('Blueprint: should navigate the trainee list', async ({ page }) => {
    // 1. Authenticate and inject valid session cookie here

    await page.goto('/admin');

    // Assert Trainee name is visible
    await expect(page.locator('text=المتدرب').first()).toBeVisible();

    // Navigate to Trainee Details
    await page.click('text=تفاصيل المتدرب');

    // Verify navigation success
    await expect(page).toHaveURL(/.*\/admin\/client\/.*/);
  });

  test('Blueprint: should assign workouts and meals', async ({ page }) => {
    // 1. Authenticate and inject valid session cookie here

    await page.goto('/admin/client/123');

    // Click "إضافة تمرين" (Add Workout)
    await page.click('button:has-text("إضافة تمرين")');

    // Select a workout from the dropdown
    await page.selectOption('select[name="workoutId"]', { index: 1 });

    // Click "إضافة" (Submit)
    await page.click('button[type="submit"]:has-text("إضافة")');

    // Verify the workout appears in the trainee's assigned list
    await expect(page.locator('.workout-item').first()).toBeVisible();
  });

  test('Blueprint: should use ZegoCloud live session feature', async ({ page }) => {
    // 1. Authenticate and inject valid session cookie here

    await page.goto('/admin/client/123');

    // Click "بدء حصة لايف" (Start Live Session)
    await page.click('button:has-text("بدء حصة لايف")');

    // Verify the ZegoCloud UI mounts
    await expect(page.locator('.zego-video-container')).toBeVisible();

    // Click to end session
    await page.click('button:has-text("إنهاء الحصة")');

    // Verify the session is closed
    await expect(page.locator('.zego-video-container')).not.toBeVisible();
  });
});
