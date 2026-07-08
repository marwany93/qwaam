import { test, expect } from '@playwright/test';

// Project: `public` — no stored session. Covers public pages + auth redirects.

// Default locale (ar) is unprefixed under next-intl localePrefix:'as-needed'.
const PUBLIC_PAGES = ['/', '/packages', '/classes', '/meals', '/science', '/login'];
const LOGIN_URL = /\/(?:ar\/)?login(?:\/|\?|$)/;

test.describe('Public pages', () => {
  for (const path of PUBLIC_PAGES) {
    test(`loads ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok(), `${path} should return 2xx`).toBeTruthy();
      // Body is present and the app shell rendered (no error boundary).
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('login page shows the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Unauthenticated redirects', () => {
  test('/admin redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('/client redirects to login', async ({ page }) => {
    await page.goto('/client');
    await expect(page).toHaveURL(LOGIN_URL);
  });
});
