import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch all translations server-side and pass as plain props — no client-side i18n bundle needed
  const t      = await getTranslations('home');
  const tBrand = await getTranslations('brand');

  const features = [
    {
      emoji: '🏋️‍♀️',
      title: t('features.coaching.title'),
      desc:  t('features.coaching.desc'),
    },
    {
      emoji: '🥗',
      title: t('features.nutrition.title'),
      desc:  t('features.nutrition.desc'),
    },
    {
      emoji: '📊',
      title: t('features.tracking.title'),
      desc:  t('features.tracking.desc'),
    },
  ];

  return (
    <HomeClient
      tagline={tBrand('tagline')}
      heroTitle={t('hero.title')}
      heroTitleAccent={t('hero.titleAccent')}
      heroSubtitle={t('hero.subtitle')}
      heroCta={t('hero.cta')}
      heroCtaSecondary={t('hero.ctaSecondary')}
      featuresTitle={t('features.title')}
      features={features}
    />
  );
}
