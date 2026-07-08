/**
 * Deterministic seed identities shared by the emulator seed script and the
 * Playwright global-setup. Pure constants — NO side effects, so it is safe to
 * import from anywhere (unlike scripts/seed-emulator.ts, which runs on import).
 */
export const SEED = {
  coach: { uid: 'coach-e2e', email: 'coach@qwaam.test' },
  traineeA: { uid: 'trainee-a-e2e', email: 'traineeA@qwaam.test' },
  traineeB: { uid: 'trainee-b-e2e', email: 'traineeB@qwaam.test' },
  password: 'Test123!',
} as const;
