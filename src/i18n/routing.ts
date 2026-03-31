import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // All supported locales
  locales: ['ar', 'en'],

  // Arabic is the primary/default locale
  defaultLocale: 'ar',

  // Use locale prefix always (e.g. /ar/packages, /en/packages)
  localePrefix: 'always',
});
