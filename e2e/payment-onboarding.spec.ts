import { test, expect } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SEED } from './seed-data';

// Issue #9 — ONBOARDING / first-subscription flow. Trainee D is pending_payment
// with NO renewal_requests doc. A banner re-upload must update ONLY the
// subscription screenshot field and must NOT create a renewal_requests doc.

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function adminDb() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'qwaam-test' });
  return getFirestore(app);
}

test.describe('Payment receipt — first-subscription re-upload (Issue #9)', () => {
  test('@smoke re-upload updates the subscription field and creates NO renewal doc', async ({ page }) => {
    await page.goto('/client');
    await expect(page.getByTestId('pending-header')).toBeVisible();

    // Wait until the client-SDK auth has hydrated (input disabled until then).
    await expect(page.getByTestId('payment-proof-input')).toBeEnabled({ timeout: 15_000 });

    await page.getByTestId('payment-proof-input').setInputFiles({
      name: 'receipt.png',
      mimeType: 'image/png',
      buffer: PNG_1x1,
    });
    await expect(page.getByTestId('payment-updated')).toBeVisible({ timeout: 30_000 });

    // Subscription screenshot updated to the freshly uploaded object.
    await expect
      .poll(
        async () => {
          const snap = await adminDb().collection('users').doc(SEED.traineeD.uid).get();
          return snap.data()?.traineeData?.subscription?.paymentScreenshotUrl as string;
        },
        { timeout: 15_000 },
      )
      .toContain('payment_proofs');

    // The guard held: no renewal_requests doc was fabricated for this trainee.
    const reqs = await adminDb()
      .collection('renewal_requests')
      .where('traineeUid', '==', SEED.traineeD.uid)
      .get();
    expect(reqs.empty).toBe(true);
  });
});
