import { test, expect } from '@playwright/test';

test.describe('Trainee Flow', () => {
  test('should redirect unauthenticated users to login from client dashboard', async ({ page }) => {
    await page.goto('/client');
    await expect(page).toHaveURL(/.*\/login.*/);
  });

  // ── BLUEPRINT TESTS ─────────────────────────────────────────────────────────
  // These tests require a valid Firebase Session Cookie or Emulator to pass.
  // They serve as structural blueprints for the expected DOM interactions.

  test('Blueprint: should view daily progress', async ({ page }) => {
    // 1. Authenticate and inject valid session cookie here

    await page.goto('/client');

    // Verify "تقدمي" (My Progress) is visible
    await expect(page.locator('text=تقدمي').first()).toBeVisible();

    // Verify progress rings/charts are visible
    await expect(page.locator('.progress-ring').first()).toBeVisible();
  });

  test('Blueprint: should check off meals and workouts', async ({ page }) => {
    // 1. Authenticate and inject valid session cookie here

    await page.goto('/client');

    // Locate an assigned meal or workout checkbox and check it
    const checkbox = page.locator('.task-checkbox').first();
    await checkbox.check();

    // Verify the UI updates to show it as completed (e.g., has 'completed' class)
    await expect(page.locator('.task-label').first()).toHaveClass(/completed/);
  });

  test('Blueprint: should join a live session', async ({ page }) => {
    // 1. Authenticate and inject valid session cookie here

    await page.goto('/client');

    // Verify "انضمام للحصة المباشرة" (Join Live Session) button is visible
    const joinButton = page.locator('button:has-text("انضمام للحصة المباشرة")');
    await expect(joinButton).toBeVisible();

    // Click the button
    await joinButton.click();

    // Verify the ZegoCloud UI mounts for the trainee
    await expect(page.locator('.zego-video-container')).toBeVisible();
  });
});
