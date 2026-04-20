// src/components/onboarding/OnboardingWithParams.tsx
// Thin client wrapper that extracts useSearchParams and passes
// subscription info as plain props to OnboardingWizard.
// This exists to keep useSearchParams inside a <Suspense> boundary.
'use client';

import { useSearchParams } from 'next/navigation';
import OnboardingWizard from './OnboardingWizard';

export default function OnboardingWithParams() {
  const searchParams = useSearchParams();

  // سحب البيانات من الرابط (URL)
  const planId      = searchParams.get('plan')     || '';
  const totalRaw    = searchParams.get('total')    || '0';
  const hasDiet     = searchParams.get('diet')     === 'true';
  const discountRaw = searchParams.get('discount') || '0';
  const email       = searchParams.get('email')    || undefined;
  const phone       = searchParams.get('phone')    || undefined;

  // حساب السعر النهائي بعد الخصم (إن وُجد)
  const totalPrice   = parseFloat(totalRaw)    || 0;
  const discount     = parseFloat(discountRaw) || 0;

  const finalPrice = discount > 0
    ? Math.round(totalPrice - (totalPrice * (discount / 100)))
    : totalPrice;

  // تمرير البيانات كـ Props للـ Wizard
  return (
    <OnboardingWizard
      initialSubscription={{
        planId,
        totalPrice: String(finalPrice),
        hasDiet,
        email,
        phone,
      }}
    />
  );
}