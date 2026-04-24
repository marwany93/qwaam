'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import type { Workout, Meal, Exercise } from '@/types';
import { revalidatePath } from 'next/cache';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toMillis(createdAt: any): number {
  return createdAt?.toMillis ? createdAt.toMillis() : Date.now();
}

// ── Exercises CRUD ─────────────────────────────────────────────────────────────

export async function getExercises(): Promise<Exercise[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('exercises').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toMillis(doc.data().createdAt),
  } as Exercise));
}

export async function addExercise(payload: Omit<Exercise, 'id' | 'createdAt'>) {
  await verifyAdminAccess();

  if (!payload.nameAr || !payload.nameEn || !payload.targetMuscle || !payload.equipment) {
    return { error: 'يرجى تعبئة جميع الحقول الإلزامية للتمرين.' };
  }
  if (!payload.defaultSets || payload.defaultSets < 1) {
    return { error: 'عدد الجولات يجب أن يكون رقماً موجباً.' };
  }
  if (!payload.defaultReps) {
    return { error: 'يرجى تحديد نطاق التكرارات.' };
  }

  try {
    const db = getAdminDb();
    await db.collection('exercises').add({
      ...payload,
      createdAt: new Date(),
    });
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('addExercise error:', err);
    return { error: 'فشل حفظ التمرين. حاول مجدداً.' };
  }
}

export async function updateExercise(id: string, payload: Partial<Omit<Exercise, 'id' | 'createdAt'>>) {
  await verifyAdminAccess();

  if (!id) return { error: 'معرّف التمرين مطلوب.' };

  try {
    const db = getAdminDb();
    await db.collection('exercises').doc(id).update({ ...payload, updatedAt: new Date() });
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('updateExercise error:', err);
    return { error: 'فشل تحديث التمرين.' };
  }
}

export async function deleteExercise(id: string) {
  await verifyAdminAccess();

  if (!id) return { error: 'معرّف التمرين مطلوب.' };

  try {
    const db = getAdminDb();
    await db.collection('exercises').doc(id).delete();
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('deleteExercise error:', err);
    return { error: 'فشل حذف التمرين.' };
  }
}

// ── Workouts CRUD ─────────────────────────────────────────────────────────────

export async function getWorkouts(): Promise<Workout[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('workouts').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toMillis(doc.data().createdAt),
  } as Workout));
}

export async function addWorkout(formData: FormData) {
  await verifyAdminAccess();

  const titleAr = formData.get('titleAr') as string;
  const titleEn = formData.get('titleEn') as string;
  const difficulty = formData.get('difficulty') as string;
  const duration = parseInt(formData.get('duration') as string, 10);
  const exercisesRaw = formData.get('exercisesJson') as string;

  if (!titleAr || !titleEn || !difficulty || !duration || !exercisesRaw) {
    return { error: 'يرجى تعبئة جميع الحقول المطلوبة.' };
  }

  let exercises = [];
  try {
    exercises = JSON.parse(exercisesRaw);
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return { error: 'يجب إضافة تمرين واحد على الأقل.' };
    }
    for (const ex of exercises) {
      if (!ex.exerciseId) {
        return { error: 'تأكد من اختيار تمرين من المكتبة لكل سطر.' };
      }
    }
  } catch {
    return { error: 'خطأ في معالجة قائمة التمارين.' };
  }

  try {
    const db = getAdminDb();
    await db.collection('workouts').add({
      titleAr, titleEn, difficulty, duration, exercises,
      createdAt: new Date(),
    });
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('addWorkout error:', err);
    return { error: 'فشل حفظ البرنامج التدريبي.' };
  }
}

export async function updateWorkout(
  id: string,
  payload: { titleAr: string; titleEn: string; difficulty: string; duration: number },
) {
  await verifyAdminAccess();
  if (!id) return { error: 'معرّف البرنامج مطلوب.' };

  const { titleAr, titleEn, difficulty, duration } = payload;
  if (!titleAr || !titleEn || !difficulty || !duration) {
    return { error: 'يرجى تعبئة جميع الحقول.' };
  }

  try {
    const db = getAdminDb();
    await db.collection('workouts').doc(id).update({
      titleAr, titleEn, difficulty, duration, updatedAt: new Date(),
    });
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('updateWorkout error:', err);
    return { error: 'فشل تحديث البرنامج التدريبي.' };
  }
}

export async function deleteWorkout(id: string) {
  await verifyAdminAccess();
  if (!id) return { error: 'معرّف البرنامج مطلوب.' };
  try {
    const db = getAdminDb();
    await db.collection('workouts').doc(id).delete();
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('deleteWorkout error:', err);
    return { error: 'فشل حذف البرنامج التدريبي.' };
  }
}

// ── Meals CRUD ─────────────────────────────────────────────────────────────────

export async function getMeals(): Promise<Meal[]> {
  await verifyAdminAccess();
  const db = getAdminDb();
  const snapshot = await db.collection('meals').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toMillis(doc.data().createdAt),
  } as Meal));
}

export async function addMeal(formData: FormData) {
  await verifyAdminAccess();

  const nameAr    = formData.get('nameAr')    as string;
  const nameEn    = formData.get('nameEn')    as string;
  const type      = formData.get('type')      as string;
  const calories  = parseInt(formData.get('calories')  as string, 10);
  const protein   = parseInt(formData.get('protein')   as string, 10);
  const carbs     = parseInt(formData.get('carbs')     as string, 10);
  const fats      = parseInt(formData.get('fats')      as string, 10);
  const recipe    = (formData.get('recipe')   as string) || '';

  if (!nameAr || !nameEn || !type) {
    return { error: 'يرجى تعبئة اسم الوجبة ونوعها.' };
  }
  if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fats)) {
    return { error: 'بيانات الماكروز غير سليمة. يرجى إدخال جميع الأرقام بشكل صحيح.' };
  }

  try {
    const db = getAdminDb();
    await db.collection('meals').add({
      nameAr, nameEn, type, calories,
      macros: { protein, carbs, fats },
      recipe: recipe || null,
      createdAt: new Date(),
    });
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('addMeal error:', err);
    return { error: 'فشل حفظ الوجبة.' };
  }
}

export async function updateMeal(
  id: string,
  payload: {
    nameAr: string; nameEn: string; type: string;
    calories: number; protein: number; carbs: number; fats: number;
    recipe?: string;
  },
) {
  await verifyAdminAccess();
  if (!id) return { error: 'معرّف الوجبة مطلوب.' };

  const { nameAr, nameEn, type, calories, protein, carbs, fats, recipe } = payload;
  if (!nameAr || !nameEn || !type) return { error: 'يرجى تعبئة الحقول الأساسية.' };
  if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fats)) {
    return { error: 'بيانات الماكروز غير سليمة.' };
  }

  try {
    const db = getAdminDb();
    await db.collection('meals').doc(id).update({
      nameAr, nameEn, type, calories,
      macros: { protein, carbs, fats },
      recipe: recipe || null,
      updatedAt: new Date(),
    });
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('updateMeal error:', err);
    return { error: 'فشل تحديث الوجبة.' };
  }
}

export async function deleteMeal(id: string) {
  await verifyAdminAccess();
  if (!id) return { error: 'معرّف الوجبة مطلوب.' };
  try {
    const db = getAdminDb();
    await db.collection('meals').doc(id).delete();
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: any) {
    console.error('deleteMeal error:', err);
    return { error: 'فشل حذف الوجبة.' };
  }
}
