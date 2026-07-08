import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, 'e2e', '.auth');
const storageStateFor = (role: string) => path.join(AUTH_DIR, `${role}.json`);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Log in once per role and reuse the saved session (storageState) per project.
  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Public / unauthenticated specs — no stored session.
    {
      name: 'public',
      testMatch: ['**/public.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    // Onboarding wizard — public, no stored session (Issue #5 smoke).
    {
      name: 'onboarding',
      testMatch: ['**/onboarding.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    // Coach-authenticated specs (admin dashboard, library).
    {
      name: 'coach',
      testMatch: ['**/coach.spec.ts'],
      use: { ...devices['Desktop Chrome'], storageState: storageStateFor('coach') },
    },
    // Trainee A — dietAdded + assigned meal plan + active schedule.
    {
      name: 'traineeA',
      testMatch: ['**/trainee.spec.ts'],
      use: { ...devices['Desktop Chrome'], storageState: storageStateFor('traineeA') },
    },
    // Trainee B — dietAdded=false (nutrition locked state).
    {
      name: 'traineeB',
      testMatch: ['**/nutrition-locked.spec.ts'],
      use: { ...devices['Desktop Chrome'], storageState: storageStateFor('traineeB') },
    },
  ],

  // Build + start the app with the client emulator flag ON. The Admin SDK picks
  // up the emulator automatically via the FIREBASE_*_EMULATOR_HOST vars that
  // `firebase emulators:exec` injects. reuseExistingServer lets the fast smoke
  // loop run against an already-running `next dev`.
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    },
  },
});
