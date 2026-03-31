import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Lightweight Edge-compatible Route Protection Regex
  // Matches any path starting with or containing /admin or /client
  const isProtectedPath = /(^\/(ar|en))?\/(admin|client)($|\/)/.test(pathname);

  if (isProtectedPath) {
    // Basic verification logic for Edge Runtime (relying strictly on cookie existence)
    // Detailed validation happens securely on the Server Actions and Layouts.
    const sessionCookie = req.cookies.get('qwaam_session');
    
    if (!sessionCookie?.value) {
      // Find the requested locale or fallback to default
      const localeMatch = pathname.match(/^\/(ar|en)/);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
      
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pass control to next-intl for localization and routing
  return intlMiddleware(req);
}

export const config = {
  // Recommend matching all logic to ensure middleware traps root /admin hits
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
