import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('hero.title') };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const tBrand = await getTranslations('brand');

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ── Hero Section ── */}
      <section className="relative bg-qwaam-pink-light text-text-main py-24 md:py-32 flex flex-col justify-center grow">
        <div className="container mx-auto px-6 text-center z-10 relative">
          
          {/* Highlight Badge */}
          <div className="inline-block px-5 py-2 rounded-full bg-qwaam-yellow text-text-main text-sm font-extrabold mb-8 shadow-sm tracking-wide">
            ⚡ {tBrand('tagline')}
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="block mb-2 text-text-main">{t('hero.title')}</span>
            <span className="text-qwaam-pink">
              {t('hero.titleAccent')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-text-muted text-lg md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            {t('hero.subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/packages"
              className="px-8 py-4 rounded-full font-bold text-lg bg-qwaam-pink text-white transition-transform hover:-translate-y-1 hover:shadow-lg shadow-qwaam-pink/30"
            >
              {t('hero.cta')}
            </Link>
            <Link
              href="/science"
              className="px-8 py-4 rounded-full font-bold text-lg bg-qwaam-white text-text-main border-2 border-border-light transition-all hover:border-qwaam-yellow hover:bg-qwaam-yellow/10"
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-qwaam-white py-24 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16 text-text-main">
            {t('features.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(['coaching', 'nutrition', 'tracking'] as const).map((feature, i) => (
              <div
                key={feature}
                className="bg-qwaam-white p-8 rounded-2xl shadow-sm border border-border-light hover:border-qwaam-pink hover:shadow-md transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-qwaam-pink-light flex items-center justify-center mb-6 text-qwaam-pink">
                  <span className="text-3xl">{['🏋️‍♂️', '🥗', '📊'][i]}</span>
                </div>
                <h3 className="text-2xl font-extrabold mb-4 text-text-main">
                  {t(`features.${feature}.title`)}
                </h3>
                <p className="text-text-muted leading-relaxed font-medium">
                  {t(`features.${feature}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
