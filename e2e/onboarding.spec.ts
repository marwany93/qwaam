import { test, expect, type Page } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SEED } from './seed-data';
import { findPlanById, NUTRITION_ADDON_PRICE } from '../src/lib/pricing-config';

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

// ── Issue #8: server-authoritative first-subscription pricing ────────────────
// The server MUST recompute amountPaid from the official plan price × the REAL
// recorded wheel discount (discount_leads), hard-capped at 40% — and must IGNORE
// the discount/total the URL supplies. These tests drive the full wizard to a
// real submit, then read the written amountPaid straight from Firestore.
//
// The whole suite runs under `firebase emulators:exec`, so the Admin SDK here
// auto-targets the Firestore emulator with a bare projectId (no real key).

function adminDb() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'qwaam-test' });
  return getFirestore(app);
}

/** Official server-side price after a (capped) discount — the expected value. */
function expectedAmount(planId: string, discountPct: number, diet: boolean): string {
  const plan = findPlanById(planId)!;
  const official = plan.price + (diet ? NUTRITION_ADDON_PRICE : 0);
  const capped = Math.min(Math.max(discountPct, 0), 40);
  return String(Math.round(official * (1 - capped / 100)));
}

async function readAmountPaid(email: string): Promise<string | undefined> {
  const snap = await adminDb().collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return undefined;
  return snap.docs[0].data()?.traineeData?.subscription?.amountPaid as string | undefined;
}

/**
 * Drive the onboarding wizard end-to-end and submit. `accountEmail` is unique
 * per run (so account creation always succeeds); `phone` is the CONTACT the
 * server uses for the lead lookup (locked/prefilled from the URL). `urlDiscount`
 * / `urlTotal` are the TAMPERED values we expect the server to ignore.
 */
async function completeOnboarding(
  page: Page,
  opts: { planId: string; accountEmail: string; phone: string; urlDiscount: number; urlTotal: number },
) {
  const params = new URLSearchParams({
    plan: opts.planId,
    total: String(opts.urlTotal),
    diet: 'false',
    discount: String(opts.urlDiscount),
    email: opts.accountEmail,
    phone: opts.phone,
  });
  await page.goto(`/onboarding?${params.toString()}`);

  // Step 0: email is prefilled + locked from the URL → advance (async check).
  await expect(page.locator('input[type="email"]')).toHaveValue(opts.accountEmail);
  await page.getByRole('button', { name: /التالي/ }).click();

  // Step 1: personal — name + DOB required (phone is locked/prefilled).
  const dob = page.locator('input[type="date"]');
  await expect(dob).toBeVisible();
  await page.locator('input[type="text"]').first().fill('متدربة سعر السيرفر');
  await dob.fill('1994-03-03');
  await page.getByRole('button', { name: /التالي/ }).click();

  // Step 2: health — defaults (all "no") are valid.
  await page.getByRole('button', { name: /التالي/ }).click();

  // Step 3: goals — pick a goal + at least one supplement.
  await page.getByRole('button', { name: /حرق الدهون/ }).click();
  await page.locator('label[for="supp_none"]').click();
  await page.getByRole('button', { name: /التالي/ }).click();

  // Step 4: body — weight, height, description (measurements stay collapsed).
  await page.locator('input[type="number"]').first().fill('70');
  await page.locator('input[type="number"]').nth(1).fill('165');
  await page.locator('textarea').fill('وصف الجسم للاختبار');
  await page.getByRole('button', { name: /التالي/ }).click();

  // Step 5: account — password, then final submit.
  await page.locator('input[type="password"]').fill('Test1234!');
  await page.getByRole('button', { name: /إنشاء الحساب/ }).click();

  // Success screen confirms submitOnboarding ran.
  await expect(page.getByText(/شكراً لتسجيلك في قوام/)).toBeVisible({ timeout: 30_000 });
}

test.describe('Onboarding — server-authoritative pricing (Issue #8)', () => {
  const PLAN = 'home-live-8'; // 550 EGP, no diet

  test('@smoke matching 30% lead → server writes official × 0.70 (not the URL value)', async ({ page }) => {
    const accountEmail = `sp30_${Date.now()}@example.com`;
    // Phone matches the seeded 30% lead; URL total is tampered to a tiny value.
    await completeOnboarding(page, {
      planId: PLAN,
      accountEmail,
      phone: SEED.leads.thirty.phone,
      urlDiscount: 30,
      urlTotal: 1,
    });
    await expect
      .poll(() => readAmountPaid(accountEmail), { timeout: 15_000 })
      .toBe(expectedAmount(PLAN, 30, false)); // 385, never the tampered total=1
  });

  test('@smoke URL says discount=60 but lead is 25% → server writes the 25% price', async ({ page }) => {
    const accountEmail = `sp25_${Date.now()}@example.com`;
    await completeOnboarding(page, {
      planId: PLAN,
      accountEmail,
      phone: SEED.leads.twentyFive.phone,
      urlDiscount: 60, // tampered — must be ignored
      urlTotal: 100,   // tampered — must be ignored
    });
    await expect
      .poll(() => readAmountPaid(accountEmail), { timeout: 15_000 })
      .toBe(expectedAmount(PLAN, 25, false)); // 413, proving URL 60% is ignored
  });

  test('@smoke URL says discount=42 but NO lead → server writes full official price', async ({ page }) => {
    const accountEmail = `spnolead_${Date.now()}@example.com`;
    await completeOnboarding(page, {
      planId: PLAN,
      accountEmail,
      phone: '01119999999', // no seeded lead for this phone/email
      urlDiscount: 42,      // tampered — must be ignored
      urlTotal: 300,        // tampered — must be ignored
    });
    await expect
      .poll(() => readAmountPaid(accountEmail), { timeout: 15_000 })
      .toBe(expectedAmount(PLAN, 0, false)); // 550, full price
  });

  test('@smoke lead stored above the cap (50%) → hard-capped at 40%', async ({ page }) => {
    const accountEmail = `spcap_${Date.now()}@example.com`;
    await completeOnboarding(page, {
      planId: PLAN,
      accountEmail,
      phone: SEED.leads.overCap.phone,
      urlDiscount: 99, // tampered — must be ignored
      urlTotal: 10,    // tampered — must be ignored
    });
    await expect
      .poll(() => readAmountPaid(accountEmail), { timeout: 15_000 })
      .toBe(expectedAmount(PLAN, 40, false)); // 330 = 40% cap, not 50%
  });
});
