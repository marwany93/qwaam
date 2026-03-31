import { getAdminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * Reusable auth check utility for all Admin Server Actions.
 * It enforces the presence of the qwaam_session cookie and 
 * ensures the JWT contains the `role: coach` custom claim.
 */
export async function verifyAdminAccess() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value;

  if (!sessionCookie) {
    throw new Error('Unauthorized: Session not found.');
  }

  const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  if (decodedClaims.role !== 'coach') {
    throw new Error('Forbidden: Coach administrative access required.');
  }

  return decodedClaims;
}

/**
 * Reusable auth check utility for Client Dashboard access.
 * Validates the `trainee` custom claim securely on the backend.
 */
export async function verifyClientAccess() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value;

  if (!sessionCookie) {
    throw new Error('Unauthorized: Session not found.');
  }

  const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  if (decodedClaims.role !== 'trainee') {
    throw new Error('Forbidden: Trainee portal access required.');
  }

  return decodedClaims;
}
