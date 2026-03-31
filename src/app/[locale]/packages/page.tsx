import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'packages' });
  return { title: t('title') };
}

export default async function PackagesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('packages');

  return (
    <section className="min-h-screen py-24 px-6">
      <div className="container mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4">{t('title')}</h1>
        <p className="text-text-secondary text-center text-xl mb-16 max-w-2xl mx-auto">{t('subtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {['Bronze', 'Silver', 'Gold'].map((tier) => (
            <div
              key={tier}
              className="p-8 rounded-2xl border border-white/10 text-center hover:border-accent/40 transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'var(--color-primary-light)' }}
            >
              <p className="text-text-muted text-sm uppercase tracking-widest mb-2">{tier}</p>
              <p className="text-5xl font-black text-accent mb-2">—</p>
              <p className="text-text-secondary text-sm">Coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
