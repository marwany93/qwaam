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
  const planId = searchParams.get('plan') || '';
  const totalPrice = searchParams.get('total') || '0';
  const hasDiet = searchParams.get('diet') === 'true';

  // تمرير البيانات كـ Props للـ Wizard
  return (
    <OnboardingWizard
      initialSubscription={{
        planId,
        totalPrice,
        hasDiet
      }}
    />
  );
}