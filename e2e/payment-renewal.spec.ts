import { test, expect } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SEED } from './seed-data';

// Issue #9 — RENEWAL flow. Trainee C is pending_payment and has a PENDING
// renewal_requests doc whose proofUrl the coach's PendingPaymentCard reads
// FIRST. A banner re-upload must refresh that proofUrl (not just the
// subscription field) so the coach sees the latest receipt.

// Valid 1x1 PNG (image/* + <10MB → passes the payment_proofs Storage rule).
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

test.describe('Payment receipt — renewal re-upload reaches the coach (Issue #9)', () => {
  test('@smoke banner re-upload updates the pending renewal_requests.proofUrl', async ({ page }) => {
    await page.goto('/client');

    // The pending banner renders for a pending_payment trainee.
    await expect(page.getByTestId('pending-header')).toBeVisible();

    // Sanity: before the re-upload the coach-facing proof is the stale seed URL.
    const reqRef = adminDb().collection('renewal_requests').doc('renewal-c-e2e');
    expect((await reqRef.get()).data()?.proofUrl).toBe(SEED.staleReceiptUrl);

    // Wait until the client-SDK auth has hydrated (the input is disabled until
    // then), so the Storage upload is authenticated.
    await expect(page.getByTestId('payment-proof-input')).toBeEnabled({ timeout: 15_000 });

    // Simulate the re-upload through the real hidden file input → Storage
    // emulator → updatePaymentScreenshot server action.
    await page.getByTestId('payment-proof-input').setInputFiles({
      name: 'receipt.png',
      mimeType: 'image/png',
      buffer: PNG_1x1,
    });

    // The transient success line confirms the server action returned success.
    await expect(page.getByTestId('payment-updated')).toBeVisible({ timeout: 30_000 });

    // The coach reads renewal_requests.proofUrl FIRST — it must now point at the
    // freshly uploaded object, not the stale seed URL.
    await expect
      .poll(async () => (await reqRef.get()).data()?.proofUrl as string, { timeout: 15_000 })
      .not.toBe(SEED.staleReceiptUrl);
    const newProof = (await reqRef.get()).data()?.proofUrl as string;
    expect(newProof).toContain('payment_proofs');

    // The subscription field is refreshed too (covers the onboarding path).
    const userSnap = await adminDb().collection('users').doc(SEED.traineeC.uid).get();
    expect(userSnap.data()?.traineeData?.subscription?.paymentScreenshotUrl).toContain('payment_proofs');
  });
});
