import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('unauthorized') };
}

export default async function UnauthorizedPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  const tCommon = await getTranslations('common');

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🚫</div>
        <h1 className="text-3xl font-extrabold mb-4 text-error">403</h1>
        <p className="text-text-secondary mb-8 leading-relaxed">{t('unauthorized')}</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'var(--color-accent)' }}
        >
          {tCommon('backHome')}
        </Link>
      </div>
    </section>
  );
}
