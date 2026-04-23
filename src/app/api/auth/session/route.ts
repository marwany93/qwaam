/**
 * POST /api/auth/session
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a long-lived Firebase session cookie from a short-lived ID token.
 *
 * Flow:
 *   1. Client signs in with Firebase Auth (client SDK)
 *   2. Client calls getIdToken() and POSTs it here
 *   3. This route verifies it and exchanges for a session cookie (up to 14 days)
 *   4. The session cookie is set as an HttpOnly cookie — inaccessible to JS
 *
 * DELETE /api/auth/session
 *   Clears the session cookie (logout).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Explicitly use Node.js runtime — firebase-admin requires Node APIs (not Edge compatible)
export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = 'qwaam_session';
const SESSION_DURATION_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

// ── POST: Create session ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken as string | undefined;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Exchange the short-lived ID token for a long-lived session cookie
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Verify the cookie to decode claims
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    
    // BULLETPROOF FIX: Always fetch the ultimate source of truth from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
    const realRole = userDoc.data()?.role || decodedClaims.role || 'trainee';

    // Self-healing: If custom claim is out of sync with the DB, fix it silently
    if (realRole !== decodedClaims.role) {
      await getAdminAuth().setCustomUserClaims(decodedClaims.uid, { role: realRole });
    }

    const response = NextResponse.json({
      success: true,
      role: realRole,
    });

    // Set the session cookie — HttpOnly prevents JS access (XSS protection)
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000, // Converted to seconds
    });

    return response;
  } catch (error: any) {
    console.error("🚨 🔥 SERVER ERROR DETAILS:", error.message || error);
    return NextResponse.json({ error: 'فشل إنشاء الجلسة / Session creation failed' }, { status: 401 });
  }
}

// ── DELETE: Clear session (logout) ───────────────────────────────────────────
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expire
  });
  return response;
}
console.log("Busting Vercel Cache - v2");