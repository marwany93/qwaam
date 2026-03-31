'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

/**
 * LanguageSwitcher — Client Component
 *
 * Uses next-intl's router to switch locales while preserving the
 * current path. e.g. /ar/packages → /en/packages
 *
 * The page/layout re-renders with the new locale including the
 * updated dir="rtl|ltr" and lang attributes on <html>.
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: 'ar' | 'en') => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center rounded-full border border-white/10 overflow-hidden bg-white/5">
      <button
        id="lang-switch-ar"
        onClick={() => switchLocale('ar')}
        disabled={locale === 'ar' || isPending}
        aria-label="Switch to Arabic"
        className={`
          px-3 py-1.5 text-xs font-bold transition-all duration-200
          ${locale === 'ar'
            ? 'bg-accent text-white cursor-default'
            : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
          }
        `}
      >
        عربي
      </button>
      <button
        id="lang-switch-en"
        onClick={() => switchLocale('en')}
        disabled={locale === 'en' || isPending}
        aria-label="Switch to English"
        className={`
          px-3 py-1.5 text-xs font-bold transition-all duration-200
          ${locale === 'en'
            ? 'bg-accent text-white cursor-default'
            : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
          }
        `}
      >
        EN
      </button>
    </div>
  );
}
