import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'science' });
  return { title: t('title') };
}

export default async function SciencePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('science');

  return (
    <section className="min-h-screen py-24 px-6">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4">{t('title')}</h1>
        <p className="text-text-secondary text-center text-xl mb-16 max-w-2xl mx-auto">{t('subtitle')}</p>
        <div className="text-center text-text-muted">
          <p>🔬 Science content coming soon</p>
        </div>
      </div>
    </section>
  );
}
