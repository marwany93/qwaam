import type { TargetMuscle, Equipment } from '@/types';

/**
 * Single source of truth for the exercise muscle-group taxonomy.
 * Imported by the add/edit form, the ExerciseBrowser, and the workout-builder
 * picker so there's no duplication. Stored values stay English; Arabic is only
 * for display (mirrors the existing WEIGHT_LEVEL_AR pattern in LibraryContent).
 */

/**
 * Canonical display order for muscle groups. Legacy `Legs`/`Arms` sit last and
 * only surface in the UI when exercises still carry those tags.
 */
export const MUSCLE_ORDER: TargetMuscle[] = [
  'Chest', 'Back', 'Trapezius', 'Shoulders',
  'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Core', 'Glutes',
  'Quadriceps', 'Hamstrings', 'Adductors', 'Abductors', 'Calves',
  'Full Body', 'Cardio',
  // legacy — deprecated, kept for old docs
  'Legs', 'Arms',
];

/**
 * Muscle options offered in the add/edit form — the canonical taxonomy only
 * (excludes the two legacy values so new exercises never get the broad tags).
 */
export const MUSCLE_FORM_OPTIONS: TargetMuscle[] = MUSCLE_ORDER.slice(0, -2);

/** Legacy muscle values kept valid for existing documents but not selectable. */
export const LEGACY_MUSCLES: TargetMuscle[] = ['Legs', 'Arms'];

export const MUSCLE_AR: Record<TargetMuscle, string> = {
  Chest: 'صدر',
  Back: 'ظهر',
  Trapezius: 'ترابيس',
  Shoulders: 'أكتاف',
  Biceps: 'بايسبس',
  Triceps: 'ترايسبس',
  Forearms: 'ساعد',
  Abs: 'بطن',
  Core: 'كور',
  Glutes: 'مؤخرة',
  Quadriceps: 'فخذ أمامي',
  Hamstrings: 'فخذ خلفي',
  Adductors: 'فخذ داخلي',
  Abductors: 'فخذ خارجي',
  Calves: 'سمانة',
  'Full Body': 'الجسم كامل',
  Cardio: 'كارديو',
  Legs: 'رجل (عام)',
  Arms: 'ذراع (عام)',
};

export const EQUIPMENT_AR: Record<Equipment, string> = {
  Bodyweight: 'وزن الجسم',
  Dumbbell: 'دمبل',
  Barbell: 'بار',
  Machine: 'جهاز',
  Cable: 'كابل',
  'Resistance Band': 'حبل مقاومة',
  Kettlebell: 'كيتل بيل',
};

export const EQUIPMENT_LIST: Equipment[] = [
  'Bodyweight', 'Dumbbell', 'Barbell', 'Machine', 'Cable', 'Resistance Band', 'Kettlebell',
];

/** Localized muscle label — Arabic for `ar`, the raw English value otherwise. */
export function muscleLabel(muscle: TargetMuscle, locale: string): string {
  return locale === 'ar' ? (MUSCLE_AR[muscle] ?? muscle) : muscle;
}

/** Localized equipment label — Arabic for `ar`, the raw English value otherwise. */
export function equipmentLabel(equipment: Equipment, locale: string): string {
  return locale === 'ar' ? (EQUIPMENT_AR[equipment] ?? equipment) : equipment;
}
