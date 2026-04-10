'use server';

import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Server Action: Check if an email already exists in Firebase Auth.
 * Called from Step 1 of the onboarding wizard before allowing progression.
 * Returns { exists: boolean }.
 *
 * We use the Admin SDK because the Client SDK's fetchSignInMethodsForEmail
 * is deprecated and unreliable. The Admin SDK getUserByEmail throws
 * auth/user-not-found when the email is clean — that's our green path.
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  try {
    await getAdminAuth().getUserByEmail(email);
    // ☝️ If this resolves without throwing, the user exists
    return { exists: true };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return { exists: false };
    }
    // Unexpected error — fail safe (don't block users due to infra hiccup)
    console.error('[checkEmailExists] Unexpected error:', error);
    return { exists: false };
  }
}
