'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import type { QwaamUser, Workout, Meal } from '@/types';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

// ── Trainee Query ────────────────────────────────────────

export async function getTraineeDetails(uid: string): Promise<QwaamUser | null> {
  await verifyAdminAccess();

  const db = getAdminDb();
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    uid: doc.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  } as QwaamUser;
}

// ── Workout Assignments ──────────────────────────────────

export async function assignWorkout(traineeUid: string, workoutId: string) {
  await verifyAdminAccess();

  const db = getAdminDb();
  await db.collection('users').doc(traineeUid).update({
    'traineeData.assignedWorkouts': FieldValue.arrayUnion(workoutId),
  });

  revalidatePath(`/admin/client/${traineeUid}`);
  return { success: true };
}

export async function removeAssignedWorkout(traineeUid: string, workoutId: string) {
  await verifyAdminAccess();

  const db = getAdminDb();
  await db.collection('users').doc(traineeUid).update({
    'traineeData.assignedWorkouts': FieldValue.arrayRemove(workoutId),
  });

  revalidatePath(`/admin/client/${traineeUid}`);
  return { success: true };
}

// ── Meal Assignments ─────────────────────────────────────

export async function assignMeal(traineeUid: string, mealId: string) {
  await verifyAdminAccess();

  const db = getAdminDb();
  await db.collection('users').doc(traineeUid).update({
    'traineeData.assignedMeals': FieldValue.arrayUnion(mealId),
  });

  revalidatePath(`/admin/client/${traineeUid}`);
  return { success: true };
}

export async function removeAssignedMeal(traineeUid: string, mealId: string) {
  await verifyAdminAccess();

  const db = getAdminDb();
  await db.collection('users').doc(traineeUid).update({
    'traineeData.assignedMeals': FieldValue.arrayRemove(mealId),
  });

  revalidatePath(`/admin/client/${traineeUid}`);
  return { success: true };
}

// ── Resolved Library Items (for Assignments Tab) ─────────

export async function getAssignedWorkouts(workoutIds: string[]): Promise<Workout[]> {
  await verifyAdminAccess();
  if (!workoutIds || workoutIds.length === 0) return [];

  const db = getAdminDb();
  // Firestore 'in' query supports max 30 items — safe for our usage
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

export async function getAssignedMeals(mealIds: string[]): Promise<Meal[]> {
  await verifyAdminAccess();
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
