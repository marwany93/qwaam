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
export const storageStateFor = (role: 'coach' | 'traineeA' | 'traineeB' | 'traineeC' | 'traineeD') =>
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
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    // Login does window.location.href → /{locale}/admin|client, but next-intl
    // localePrefix:'as-needed' strips the default-locale (ar) prefix, so the
    // final URL is unprefixed (/admin, /client). Match with an optional /ar.
    await page.waitForURL(expectUrl, { timeout: 30_000 });

    // Firebase Auth persists the signed-in user in IndexedDB
    // (firebaseLocalStorageDb → firebaseLocalStorage store, key
    // `firebase:authUser:…`). The write is async, so capturing storageState too
    // early races the flush and leaves `auth.currentUser` null in the restored
    // context (the payment-receipt upload reads it). Wait until the record
    // exists, THEN capture IndexedDB (default storageState omits it).
    await page.waitForFunction(
      () =>
        new Promise<boolean>((resolve) => {
          let req: IDBOpenDBRequest;
          try {
            req = indexedDB.open('firebaseLocalStorageDb');
          } catch {
            resolve(false);
            return;
          }
          req.onsuccess = () => {
            try {
              const store = req.result
                .transaction('firebaseLocalStorage', 'readonly')
                .objectStore('firebaseLocalStorage');
              const keysReq = store.getAllKeys();
              keysReq.onsuccess = () =>
                resolve(keysReq.result.some((k) => String(k).includes('authUser')));
              keysReq.onerror = () => resolve(false);
            } catch {
              resolve(false);
            }
          };
          req.onerror = () => resolve(false);
        }),
      { timeout: 15_000 },
    );

    await page.context().storageState({ path: file, indexedDB: true });
  } finally {
    await browser.close();
  }
}

// Locale-agnostic URL matchers (default locale ar is unprefixed under as-needed).
const ADMIN_URL = /\/(?:ar\/)?admin(?:\/|\?|$)/;
const CLIENT_URL = /\/(?:ar\/)?client(?:\/|\?|$)/;

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects.find((p) => p.use?.baseURL)?.use.baseURL ?? 'http://localhost:3000';

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await loginAndSave(baseURL, SEED.coach.email, SEED.password, storageStateFor('coach'), ADMIN_URL);
  await loginAndSave(baseURL, SEED.traineeA.email, SEED.password, storageStateFor('traineeA'), CLIENT_URL);
  await loginAndSave(baseURL, SEED.traineeB.email, SEED.password, storageStateFor('traineeB'), CLIENT_URL);
  await loginAndSave(baseURL, SEED.traineeC.email, SEED.password, storageStateFor('traineeC'), CLIENT_URL);
  await loginAndSave(baseURL, SEED.traineeD.email, SEED.password, storageStateFor('traineeD'), CLIENT_URL);
}
