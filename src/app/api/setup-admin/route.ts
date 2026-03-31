import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Explicitly use Node.js runtime — firebase-admin requires Node APIs (not Edge compatible)
export const runtime = 'nodejs';

/**
 * UTILITY DEVELOPER ROUTE (Setup Configuration)
 * Promotes a standard Firebase Auth user account securely to the "coach" role via Custom Claims.
 * 
 * Flow Instruction:
 * 1. Register a user in standard Firebase Auth / Console
 * 2. Visit:   http://localhost:3000/api/setup-admin?email=your_email@example.com
 * 3. Success! Now map directly back to /login using the same credentials.
 * 
 * ⚠️ DANGER: Remove this file entirely before publishing to production via Vercel!
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email query parameter. Try ?email=...' }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Locate User ID from standard Auth Table
    const user = await auth.getUserByEmail(email);

    // 2. Inject Cryptographic Role Validation
    await auth.setCustomUserClaims(user.uid, { role: 'coach' });

    // 3. Sync Coach Profile inside the users collection for Data Integrity
    await db.collection('users').doc(user.uid).set({
      role: 'coach',
      name: user.displayName || 'Coach Admin (Root)',
      email: user.email,
      createdAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully promoted ${email} to 'coach' Custom Claim. You can now authenticate and access the dashboard.`
    });

  } catch (error: any) {
    console.error('[QWAAM ADMIN SETUP ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign critical coach claim' },
      { status: 500 }
    );
  }
}
