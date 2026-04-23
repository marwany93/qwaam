import { getAdminAuth, getAdminDb } from './firebase-admin';
import { cookies } from 'next/headers';


/**
 * Reusable auth check utility for all Admin Server Actions.
 * It enforces the presence of the qwaam_session cookie and 
 * ensures the JWT contains the `role: coach` or `role: admin` custom claim.
 */
export async function verifyAdminAccess() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value;

  if (!sessionCookie) {
    throw new Error('Unauthorized: Session not found.');
  }

  const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  if (decodedClaims.role !== 'coach' && decodedClaims.role !== 'admin') {
    throw new Error('Forbidden: Admin or Coach access required.');
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

  try {
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    if (decodedClaims.role !== 'trainee') {
      // 🚀 ميزة الشفاء الذاتي (Auto-Heal)
      const db = getAdminDb();
      const userDoc = await db.collection('users').doc(decodedClaims.uid).get();

      if (userDoc.exists) {
        // بما إن بياناتها موجودة في جدول المتدربين، هنرجّع الصلاحية فوراً
        await getAdminAuth().setCustomUserClaims(decodedClaims.uid, { role: 'trainee' });
      } else {
        // لو مش موجودة في الداتا بيز أصلاً، ده يوزر غريب ونمنعه
        throw new Error('Forbidden: Trainee portal access required.');
      }
    }

    return decodedClaims;
  } catch (error) {
    // لو الكوكي منتهية أو فيها مشكلة، نرفض الدخول بهدوء
    console.error('Session verification failed:', error);
    throw new Error('Unauthorized');
  }
}