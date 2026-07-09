/**
 * Deterministic seed identities shared by the emulator seed script and the
 * Playwright global-setup. Pure constants — NO side effects, so it is safe to
 * import from anywhere (unlike scripts/seed-emulator.ts, which runs on import).
 */
export const SEED = {
  coach: { uid: 'coach-e2e', email: 'coach@qwaam.test' },
  traineeA: { uid: 'trainee-a-e2e', email: 'traineeA@qwaam.test' },
  traineeB: { uid: 'trainee-b-e2e', email: 'traineeB@qwaam.test' },
  // Pending-payment trainees for the Issue #9 receipt re-upload tests.
  // C = RENEWAL flow (has a pending renewal_requests doc the coach reads first).
  // D = onboarding/first-subscription flow (NO renewal_requests doc).
  traineeC: { uid: 'trainee-c-e2e', email: 'traineeC@qwaam.test' },
  traineeD: { uid: 'trainee-d-e2e', email: 'traineeD@qwaam.test' },
  // A deliberately old/stale receipt URL seeded on C's pending renewal request,
  // so a banner re-upload must visibly replace it.
  staleReceiptUrl: 'https://example.com/OLD-receipt-do-not-show.png',
  password: 'Test123!',
  // Recorded wheel discounts (discount_leads) for the server-authoritative
  // pricing @smoke tests. Emails are stored lowercased/trimmed exactly as
  // `spinDiscountWheel` writes them, so the server lead lookup matches.
  leads: {
    thirty: { email: 'lead30@qwaam.test', phone: '01110000030', discountPercentage: 30 },
    twentyFive: { email: 'lead25@qwaam.test', phone: '01110000025', discountPercentage: 25 },
    // Stored above the 40% cap on purpose — proves the server hard-caps at 40%.
    overCap: { email: 'leadcap@qwaam.test', phone: '01110000050', discountPercentage: 50 },
  },
} as const;
