import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Static dictionary mapping to avoid Webpack dynamic require context (__dirname)
const messagesMap: Record<string, () => Promise<any>> = {
  ar: () => import('../../messages/ar.json').then((mod) => mod.default),
  en: () => import('../../messages/en.json').then((mod) => mod.default)
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: await messagesMap[locale]()
  };
});
