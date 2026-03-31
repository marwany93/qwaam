import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Cairo, Inter } from 'next/font/google';
import { routing } from '@/i18n/routing';

// ── Google Fonts ────────────────────────────────────────────────────────────
// Cairo: Arabic-first font (RTL-optimized)
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
});

// Inter: English/Latin font
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: false, // Only preload Arabic (primary locale)
});

// ── Type Definitions ────────────────────────────────────────────────────────
type Locale = 'ar' | 'en';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// ── Dynamic Metadata ────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brand' });

  return {
    title: {
      template: `%s | ${t('name')}`,
      default: `${t('name')} — ${t('tagline')}`,
    },
    description: t('tagline'),
    // OpenGraph locale
    openGraph: {
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      siteName: 'قوام - Qwaam',
    },
  };
}

// ── Static Params ────────────────────────────────────────────────────────────
// Tell Next.js which locale segments to pre-render at build time
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ── Locale Layout ────────────────────────────────────────────────────────────
/**
 * This is the heart of the RTL/LTR system.
 *
 * - Sets `lang` on <html> so browsers apply correct typography rules
 * - Sets `dir="rtl"` for Arabic and `dir="ltr"` for English
 * - Injects the correct Google Font variable (Cairo for AR, Inter for EN)
 * - Provides all i18n messages to Client Components via NextIntlClientProvider
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale — show 404 for unsupported locales
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // IMPORTANT: This call enables static rendering for next-intl.
  // Without it, every page becomes dynamically rendered.
  setRequestLocale(locale);

  // Determine text direction
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // Choose active font family
  const activeFontVariable = locale === 'ar' ? cairo.variable : inter.variable;

  // Load messages for NextIntlClientProvider
  const messages = await getMessages();

  return (
    // Override the html tag set by the root layout with locale-specific attributes
    // suppressHydrationWarning prevents false positive hydration mismatch warnings
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`
          ${activeFontVariable}
          min-h-screen
          bg-primary
          text-text-primary
          antialiased
          flex flex-col
        `}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
