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
