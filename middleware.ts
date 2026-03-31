import { NextResponse } from 'next/server';

export default function middleware(request: Request) {
  // Naked Middleware: Doing absolutely nothing to test Vercel
  console.log("🔥 NAKED MIDDLEWARE RUNNING");
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};