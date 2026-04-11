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

export async function updateTraineeProfile(uid: string, data: Record<string, any>) {
  // Ensure the user only updates their own profile
  const decodedToken = await verifyClientAccess();
  if (decodedToken.uid !== uid) {
    throw new Error('Unauthorized');
  }

  const db = getAdminDb();
  
  // Construct update payload using dot-notation to ONLY update 'onboarding' fields
  // and the top-level 'name' field if provided.
  const updatePayload: Record<string, any> = {};
  
  if (data.name) {
    updatePayload['name'] = data.name;
    // Note: We don't update Firebase Auth displayName here because Server Actions 
    // shouldn't mix Admin SDK Auth updates if we can help it, but wait, updating
    // the Firestore doc is enough for the UI.
  }
  
  for (const [key, value] of Object.entries(data)) {
    // Skip name as it's handled above, and skip undefined
    if (key === 'name' || value === undefined) continue;
    
    updatePayload[`onboarding.${key}`] = value;
  }

  if (Object.keys(updatePayload).length > 0) {
    await db.collection('users').doc(uid).update(updatePayload);
  }
  
  return { success: true };
}
