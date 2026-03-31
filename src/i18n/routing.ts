import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // All supported locales
  locales: ['ar', 'en'],

  // Arabic is the primary/default locale
  defaultLocale: 'ar',

  // Use locale prefix only when necessary (e.g. /en/packages but /packages for Arabic)
  localePrefix: 'as-needed',
});
