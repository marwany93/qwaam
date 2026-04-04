// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing'; // لاحظ المسار هنا بقى مباشر لأنه في نفس الفولدر

export default createMiddleware(routing);

export const config = {
  // الماتشر ده بيضمن إن الميدل وير يمسك كل الصفحات
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};