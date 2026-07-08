/**
 * Playwright global-setup — logs in once per seeded role by driving the REAL
 * `/ar/login` form against the emulator-backed app, then saves each role's
 * `storageState` (which carries the HttpOnly `qwaam_session` cookie) so specs
 * can reuse the session without re-logging-in every test.
 *
 * Runs after the webServer is up (Playwright waits for it) and after the seed
 * has created the users (see the `test:e2e` script order).
 */
import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { SEED } from './seed-data';

export const AUTH_DIR = path.join(__dirname, '.auth');
export const storageStateFor = (role: 'coach' | 'traineeA' | 'traineeB') =>
  path.join(AUTH_DIR, `${role}.json`);

async function loginAndSave(
  baseURL: string,
  email: string,
  password: string,
  file: string,
  expectUrl: RegExp,
) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  try {
    await page.goto('/ar/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    // Login does window.location.href → /ar/admin (coach) or /ar/client (trainee).
    await page.waitForURL(expectUrl, { timeout: 30_000 });
    await page.context().storageState({ path: file });
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects.find((p) => p.use?.baseURL)?.use.baseURL ?? 'http://localhost:3000';

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await loginAndSave(baseURL, SEED.coach.email, SEED.password, storageStateFor('coach'), /\/ar\/admin/);
  await loginAndSave(baseURL, SEED.traineeA.email, SEED.password, storageStateFor('traineeA'), /\/ar\/client/);
  await loginAndSave(baseURL, SEED.traineeB.email, SEED.password, storageStateFor('traineeB'), /\/ar\/client/);
}
