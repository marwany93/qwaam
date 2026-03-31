'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import type { QwaamUser } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Retrieves the list of all active trainees.
 * Only callable by authenticated coaches.
 */
export async function getClients(): Promise<QwaamUser[]> {
  await verifyAdminAccess();

  const db = getAdminDb();
  // Query users where role == 'trainee'
  const snapshot = await db.collection('users').where('role', '==', 'trainee').get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      // Admin SDK uses Firebase Admin Timestamp
      // Next.js requires plain objects to pass back to Server/Client Components
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    } as QwaamUser;
  });
}

/**
 * Adds a new trainee to the system.
 * Flow:
 * 1. Creates Firebase Auth user.
 * 2. Assigns `role: trainee` claim.
 * 3. Builds Firestore profile entry.
 * 4. Generates a password reset link for the coach to send to the trainee.
 */
export async function addClient(formData: FormData) {
  const decodedClaims = await verifyAdminAccess();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Create user in Firebase Auth
    // Auto-generate a complex random password since we'll send a password reset link
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!zQ';
    
    const userRecord = await auth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // 2. Set Custom Claim 'role: trainee'
    await auth.setCustomUserClaims(userRecord.uid, { role: 'trainee' });

    // 3. Create document in 'users' collection
    await db.collection('users').doc(userRecord.uid).set({
      role: 'trainee',
      name,
      email,
      createdAt: new Date(),
      traineeData: {
        assignedCoachUid: decodedClaims.uid,
        assignedWorkouts: [],
        assignedMeals: [],
        progress: {}
      }
    });

    // 4. Generate the password reset email directly via Firebase Admin
    const resetLink = await auth.generatePasswordResetLink(email);
    console.log(`[QWAAM SERVICE] Sent reset link to trainee ${email}`);

    // Force Next.js to re-fetch the dashboard list on the next render
    revalidatePath('/admin'); 
    
    // Return the reset link so the Coach can copy it and send via WhatsApp!
    return { success: true, resetLink };

  } catch (error: any) {
    console.error('Error adding client:', error);
    // Return safe error messages
    const msg = error.code === 'auth/email-already-exists' 
      ? 'هذا البريد الإلكتروني مسجل مسبقاً.' 
      : 'حدث خطأ أثناء إضافة المتدرب.';
      
    return { error: msg };
  }
}
