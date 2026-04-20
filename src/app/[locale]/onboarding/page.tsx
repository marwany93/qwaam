// src/app/[locale]/onboarding/page.tsx
// Public page — no auth required. Accessible right after package selection.
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Suspense } from 'react';
import OnboardingWithParams from '@/components/onboarding/OnboardingWithParams';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'onboarding' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function OnboardingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-qwaam-pink-light via-white to-qwaam-yellow/10 py-8 px-4 relative overflow-hidden">

      {/* Ambient background blobs */}
      <div className="absolute top-[-15%] end-[-10%] w-[500px] h-[500px] bg-qwaam-pink/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] start-[-10%] w-[400px] h-[400px] bg-qwaam-yellow/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo top-bar for non-admin page */}
      <div className="flex justify-center mb-8 relative z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/brand/logo-pink.png"
            alt="Qwaam"
            width={130}
            height={43}
            priority
            className="w-auto h-auto"
          />
        </Link>
      </div>

      {/* Wizard Card — Suspense required for useSearchParams */}
      <div className="relative z-10 max-w-xl mx-auto">
        <Suspense fallback={
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center animate-pulse">
            <div className="w-8 h-8 rounded-full border-4 border-qwaam-pink border-t-transparent animate-spin mx-auto" />
          </div>
        }>
          <OnboardingWithParams />
        </Suspense>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-text-muted font-bold mt-6 relative z-10">
        منصة قوام للمرأة فقط 🌸 — جميع بياناتكِ محمية وآمنة
      </p>
    </div>
  );
}
