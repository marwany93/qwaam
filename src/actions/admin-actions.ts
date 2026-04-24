'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import type { QwaamUser } from '@/types';
import { revalidatePath } from 'next/cache';
import { notificationService } from '@/lib/notification-service';

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

/**
 * Fetches all trainees.
 */
export async function getTrainees(): Promise<QwaamUser[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('users').where('role', '==', 'trainee').get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    } as QwaamUser;
  });
}

/**
 * Fetches all coaches. Returns minimal data for dropdowns.
 */
export async function getCoaches(): Promise<{ uid: string; name: string }[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('users').where('role', '==', 'coach').get();
  
  return snapshot.docs.map(doc => ({
    uid: doc.id,
    name: doc.data().name || 'Unnnamed Coach',
  }));
}

/**
 * Assigns a coach to a trainee.
 */
export async function assignCoach(traineeUid: string, coachUid: string) {
  await verifyAdminAccess();
  const db = getAdminDb();
  
  try {
    const batch = db.batch();
    const traineeRef = db.collection('users').doc(traineeUid);
    batch.update(traineeRef, {
      'traineeData.assignedCoachUid': coachUid
    });
    
    await batch.commit();

    // Revalidate the entire layout to ensure both Admin and Client routes are synced across any locale
    revalidatePath('/', 'layout');

    // Fetch details for the notification
    const [traineeDoc, coachDoc] = await Promise.all([
      traineeRef.get(),
      db.collection('users').doc(coachUid).get()
    ]);

    if (traineeDoc.exists && coachDoc.exists) {
      const traineeData = traineeDoc.data();
      const coachData = coachDoc.data();
      
      if (traineeData?.email && traineeData?.name && coachData?.name) {
        notificationService.notifyCoachAssigned(
          traineeData.email,
          traineeData.name,
          coachData.name
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error assigning coach:', error);
    return { error: 'Failed to assign coach' };
  }
}

/**
 * Deducts one session from a trainee's remaining sessions and logs the activity.
 */
export async function logTraineeSession(traineeUid: string, notes: string = '') {
  await verifyAdminAccess();
  const db = getAdminDb();
  
  try {
    const traineeRef = db.collection('users').doc(traineeUid);
    const traineeDoc = await traineeRef.get();
    
    if (!traineeDoc.exists) return { success: false, error: 'المتدرب غير موجود' };
    
    const sessionTracking = traineeDoc.data()?.sessionTracking;
    const currentSessions = sessionTracking?.remainingSessions || 0;
    
    if (currentSessions <= 0) {
      return { success: false, error: 'رصيد الحصص نفذ، يرجى تجديد الباقة' };
    }

    const batch = db.batch();
    
    // 1. Decrement session
    batch.update(traineeRef, {
      'sessionTracking.remainingSessions': currentSessions - 1,
      'sessionTracking.planStatus': (currentSessions - 1) === 0 ? 'finished' : 'active'
    });
    
    // 2. Log the session history
    const logRef = db.collection('session_logs').doc();
    batch.set(logRef, {
      traineeUid,
      date: new Date(),
      notes,
      type: 'workout_session'
    });
    
    await batch.commit();
    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true, remaining: currentSessions - 1 };
  } catch (error) {
    console.error('Error logging session:', error);
    return { success: false, error: 'حدث خطأ أثناء تسجيل الحصة' };
  }
}

/**
 * Adds sessions to a trainee's existing plan.
 * ADDS to current totals — does not override them.
 */
export async function renewTraineePlan(traineeUid: string, additionalSessions: number) {
  await verifyAdminAccess();
  const db = getAdminDb();

  try {
    const traineeRef = db.collection('users').doc(traineeUid);

    // Read current values first so we can ADD rather than override
    const traineeDoc = await traineeRef.get();
    if (!traineeDoc.exists) return { success: false, error: 'المتدرب غير موجود' };

    const current = traineeDoc.data()?.sessionTracking;
    const currentTotal     = current?.totalSessions     ?? 0;
    const currentRemaining = current?.remainingSessions ?? 0;

    const newTotal     = currentTotal     + additionalSessions;
    const newRemaining = currentRemaining + additionalSessions;

    await traineeRef.update({
      'sessionTracking.totalSessions':     newTotal,
      'sessionTracking.remainingSessions': newRemaining,
      'sessionTracking.planStatus':        'active',
      'sessionTracking.lastRenewedAt':     new Date(),
      // Clear any pending renewal request so the admin panel badge disappears
      'renewalRequest.status': 'fulfilled',
    });

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true, newTotal, newRemaining };
  } catch (error) {
    console.error('Error renewing plan:', error);
    return { success: false, error: 'حدث خطأ أثناء تجديد الباقة' };
  }
}

/**
 * Manual DB override — sets exact values regardless of current state.
 * Used by the admin Danger Zone only.
 */
export async function overrideTraineeSessions(
  traineeUid: string,
  totalSessions: number,
  remainingSessions: number,
) {
  await verifyAdminAccess();

  if (remainingSessions > totalSessions) {
    return { success: false, error: 'الحصص المتبقية لا يمكن أن تتجاوز الإجمالي.' };
  }

  const db = getAdminDb();
  try {
    await db.collection('users').doc(traineeUid).update({
      'sessionTracking.totalSessions':     totalSessions,
      'sessionTracking.remainingSessions': remainingSessions,
      'sessionTracking.planStatus':        remainingSessions <= 0 ? 'finished' : 'active',
    });

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true };
  } catch (error) {
    console.error('Error overriding sessions:', error);
    return { success: false, error: 'حدث خطأ أثناء التعديل اليدوي' };
  }
}

/**
 * Sets activeRoomUrl on the trainee's document so the trainee sees the "Join" button.
 */
export async function startLiveSession(traineeUid: string, roomName: string) {
  await verifyAdminAccess();
  const db = getAdminDb();
  try {
    await db.collection('users').doc(traineeUid).update({ activeRoomUrl: roomName });
    return { success: true };
  } catch (error) {
    console.error('startLiveSession error:', error);
    return { success: false, error: 'فشل بدء الحصة المباشرة' };
  }
}

/**
 * Called when the admin leaves the Jitsi call.
 * Deducts 1 session and clears the activeRoomUrl so the trainee's join button disappears.
 */
export async function endLiveSession(traineeUid: string) {
  await verifyAdminAccess();
  const db = getAdminDb();
  try {
    const traineeRef = db.collection('users').doc(traineeUid);
    const traineeDoc = await traineeRef.get();
    if (!traineeDoc.exists) return { success: false, error: 'المتدرب غير موجود' };

    const remaining = traineeDoc.data()?.sessionTracking?.remainingSessions ?? 0;
    const newRemaining = Math.max(0, remaining - 1);

    await traineeRef.update({
      activeRoomUrl: null,
      'sessionTracking.remainingSessions': newRemaining,
      'sessionTracking.planStatus': newRemaining === 0 ? 'finished' : 'active',
    });

    // Log to session_logs for the history trail
    await db.collection('session_logs').add({
      traineeUid,
      date: new Date(),
      notes: 'حصة لايف مباشرة عبر Jitsi',
      type: 'live_session',
    });

    revalidatePath(`/admin/client/${traineeUid}`);
    return { success: true, newRemaining };
  } catch (error) {
    console.error('endLiveSession error:', error);
    return { success: false, error: 'فشل إنهاء الحصة' };
  }
}
