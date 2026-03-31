import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// 1. Inlined Routing Config (ZERO external project dependencies to prevent Edge leakage)
const intlMiddleware = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed'
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 2. Lightweight Edge-compatible Route Protection
  const isProtectedPath = /(^\/(ar|en))?\/(admin|client)($|\/)/.test(pathname);

  if (isProtectedPath) {
    const sessionCookie = req.cookies.get('qwaam_session');

    if (!sessionCookie?.value) {
      const localeMatch = pathname.match(/^\/(ar|en)(\/|$)/);
      const isExplicitLocale = !!localeMatch;
      const locale = isExplicitLocale ? localeMatch[1] : 'ar';

      const loginPath = locale === 'ar' && !isExplicitLocale
        ? '/login'
        : `/${locale}/login`;

      const loginUrl = new URL(loginPath, req.url);
      loginUrl.searchParams.set('redirect', pathname);

      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Pass control to next-intl
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/',

    '/(ar|en)/:path*',

    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};