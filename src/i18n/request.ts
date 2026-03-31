import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// 1. Static Synchronous Imports (ZERO Webpack Dynamic Chunking = ZERO __dirname)
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // 2. Direct memory assignment
    messages: locale === 'en' ? enMessages : arMessages
  };
});