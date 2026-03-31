'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminAccess } from '@/lib/auth-utils';
import type { Workout, Meal } from '@/types';
import { revalidatePath } from 'next/cache';

// ── Workouts Engine ─────────────────────────────────────

export async function getWorkouts(): Promise<Workout[]> {
  await verifyAdminAccess();

  const db = getAdminDb();
  const snapshot = await db.collection('workouts').orderBy('createdAt', 'desc').get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    } as Workout;
  });
}

export async function addWorkout(formData: FormData) {
  await verifyAdminAccess();

  const titleAr = formData.get('titleAr') as string;
  const titleEn = formData.get('titleEn') as string;
  const difficulty = formData.get('difficulty') as string;
  const duration = parseInt(formData.get('duration') as string, 10);
  const exercisesRaw = formData.get('exercisesJson') as string;

  if (!titleAr || !titleEn || !difficulty || !duration || !exercisesRaw) {
    return { error: 'يرجى تعبئة جميع الحقول المطلوبة الأساسية.' };
  }

  let exercises = [];
  try {
    exercises = JSON.parse(exercisesRaw);
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return { error: 'يجب إضافة تمرين واحد على الأقل.' };
    }
    // Strict Database Mapping Validation
    for (const ex of exercises) {
      if (!ex.name || !ex.sets || !ex.reps) {
        return { error: 'تأكد من إدخال الجولات والتكرارات واسم التمرين لجميع حقول التمارين.' };
      }
    }
  } catch (e) {
    return { error: 'خطأ في معالجة التمارين المدخلة.' };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection('workouts').doc(); // Auto-gen unique ID
    
    await docRef.set({
      titleAr,
      titleEn,
      difficulty,
      duration,
      exercises,
      createdAt: new Date(),
    });

    revalidatePath('/admin/library');
    return { success: true };
  } catch (error: any) {
    console.error('Add Workout Crash:', error);
    return { error: 'حدث خطأ غير متوقع أثناء حفظ البرنامج.' };
  }
}

// ── Meals Engine ────────────────────────────────────────

export async function getMeals(): Promise<Meal[]> {
  await verifyAdminAccess();

  const db = getAdminDb();
  const snapshot = await db.collection('meals').orderBy('createdAt', 'desc').get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
    } as Meal;
  });
}

export async function addMeal(formData: FormData) {
  await verifyAdminAccess();

  const nameAr = formData.get('nameAr') as string;
  const nameEn = formData.get('nameEn') as string;
  const calories = parseInt(formData.get('calories') as string, 10);
  const protein = parseInt(formData.get('protein') as string, 10);
  const carbs = parseInt(formData.get('carbs') as string, 10);
  const fats = parseInt(formData.get('fats') as string, 10);

  // Strict Macro Constraints
  if (!nameAr || !nameEn || isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fats)) {
    return { error: 'بيانات الماكروز غير سليمة. يرجى إدخال جميع الأرقام بشكل صحيح.' };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection('meals').doc();
    
    await docRef.set({
      nameAr,
      nameEn,
      calories,
      macros: {
        protein,
        carbs,
        fats
      },
      createdAt: new Date(),
    });

    revalidatePath('/admin/library');
    return { success: true };
  } catch (error: any) {
    console.error('Add Meal Crash:', error);
    return { error: 'فشل حفظ الوجبة بالنظام.' };
  }
}
