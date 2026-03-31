import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed'
});

export const config = {
  // ده الـ Matcher الرسمي المعتمد اللي بيمسك كل المسارات صح
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};