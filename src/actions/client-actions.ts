'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyClientAccess } from '@/lib/auth-utils';
import type { QwaamUser, Workout, Meal } from '@/types';

export async function getCurrentTrainee(): Promise<QwaamUser | null> {
  const decodedToken = await verifyClientAccess();
  const db = getAdminDb();
  
  const doc = await db.collection('users').doc(decodedToken.uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data()!;
  return {
    uid: doc.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  } as QwaamUser;
}

export async function fetchMyWorkouts(workoutIds: string[]): Promise<Workout[]> {
  await verifyClientAccess();
  if (!workoutIds || workoutIds.length === 0) return [];
  
  const db = getAdminDb();
  const snapshot = await db.collection('workouts').where('__name__', 'in', workoutIds).get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    } as Workout;
  });
}

export async function fetchMyMeals(mealIds: string[]): Promise<Meal[]> {
  await verifyClientAccess();
  if (!mealIds || mealIds.length === 0) return [];
  
  const db = getAdminDb();
  const snapshot = await db.collection('meals').where('__name__', 'in', mealIds).get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    } as Meal;
  });
}

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

export async function updateTraineeProfile(uid: string, data: Record<string, any>) {
  // Ensure the user only updates their own profile
  const decodedToken = await verifyClientAccess();
  if (decodedToken.uid !== uid) {
    throw new Error('Unauthorized');
  }

  const db = getAdminDb();
  
  // Recursively sanitize undefined -> null since Firestore rejects undefined deeply
  const sanitizedData = sanitizeForFirestore(data);
  
  // Construct update payload using dot-notation to ONLY update 'onboarding' fields
  // and the top-level 'name' field if provided.
  const updatePayload: Record<string, any> = {};
  
  if (sanitizedData.name) {
    updatePayload['name'] = sanitizedData.name;
  }
  
  for (const [key, value] of Object.entries(sanitizedData)) {
    // Skip name as it's handled above
    if (key === 'name') continue;
    
    updatePayload[`onboarding.${key}`] = value;
  }

  if (Object.keys(updatePayload).length > 0) {
    await db.collection('users').doc(uid).update(updatePayload);
  }
  
  return { success: true };
}

/**
 * Creates the initial user document in Firestore.
 * Handles the server-side write to bypass client-side rules and serialization bugs.
 */
export async function submitOnboarding(uid: string, docPayload: Record<string, any>) {
  try {
    const db = getAdminDb();
    
    // Server actions must use native Dates or Admin SDK timestamps
    const payload = {
      ...docPayload,
      createdAt: new Date(),
    };

    await db.collection('users').doc(uid).set(payload);

    return { success: true, uid };
  } catch (err: any) {
    console.error('Error in submitOnboarding:', err);
    return { success: false, error: err.message };
  }
}
