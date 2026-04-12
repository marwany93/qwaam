// src/lib/onboarding-schema.ts
// Zod validation schema for each step of the onboarding wizard.
// react-hook-form resolves validation against each step's sub-schema.
import { z } from 'zod';

// ── Step 1: Email ─────────────────────────────────────────────────────────────
export const step1Schema = z.object({
  email: z.string().min(1, 'هذا الحقل مطلوب').email('صيغة البريد الإلكتروني غير صحيحة'),
});

// ── Step 2: Personal Info ─────────────────────────────────────────────────────
export const step2Schema = z.object({
  name: z.string().min(1, 'الاسم الكامل مطلوب'),
  dateOfBirth: z.string().min(1, 'تاريخ الميلاد مطلوب'),
  phone: z.string().min(1, 'رقم الجوال مطلوب'),
  maritalStatus: z.enum(['single', 'married'], { message: 'الرجاء اختيار الحالة الاجتماعية' }),
  isPregnant: z.boolean().optional(),
  isNursing: z.boolean().optional(),
  hasChildren: z.boolean().optional(),
});

// ── Step 3: Health ────────────────────────────────────────────────────────────
export const step3Schema = z.object({
  hasInjuries: z.boolean({ message: 'الرجاء الإجابة على هذا السؤال' }).catch(false),
  injuryDetails: z.string().optional(),
  hasChronicDiseases: z.boolean({ message: 'الرجاء الإجابة على هذا السؤال' }).catch(false),
  chronicDiseases: z.array(z.string()).optional(),
  isSmoker: z.boolean({ message: 'الرجاء الإجابة على هذا السؤال' }).catch(false),
  thyroidStatus: z.enum(['active', 'inactive']).optional(),
  otherDiseaseDetails: z.string().optional(),
});

// ── Step 4: Goals ─────────────────────────────────────────────────────────────
export const step4Schema = z.object({
  primaryGoal: z.enum(['fatBurn', 'gainMuscle', 'gainWeight'], { message: 'الرجاء اختيار هدف من القائمة' }),
  workoutDaysPerWeek: z.coerce.number({ message: 'يجب أن يكون رقماً' }).min(1, 'يوم واحد على الأقل').max(7, '7 أيام كحد أقصى'),
  sportsExperience: z.string().optional(),
  currentSupplements: z.array(z.string()).min(1, 'الرجاء اختيار خيار واحد على الأقل'),
});

const optNum = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) return undefined;
  return Number(val);
}, z.number().optional());

export const step5Schema = z.object({
  weight: z.coerce.number({ message: 'الوزن يجب أن يكون رقماً' }).min(20, 'الوزن غير منطقي').max(300, 'الوزن غير منطقي'),
  height: z.coerce.number({ message: 'الطول يجب أن يكون رقماً' }).min(100, 'الطول غير منطقي').max(250, 'الطول غير منطقي'),
  bodyDescription: z.string().min(1, 'الرجاء وصف جسدكِ'),
  // FileList can't be serialized — validated manually in the component
  inbodyFile: z.any().optional(),
  bodyPhotoFile: z.any().optional(),
  measurements: z
    .object({
      chest: optNum,
      shoulders: optNum,
      waist: optNum,
      abdomen: optNum,
      glutes: optNum,
      rightThigh: optNum,
      leftThigh: optNum,
      rightCalf: optNum,
      leftCalf: optNum,
      rightArm: optNum,
      leftArm: optNum,
    })
    .optional(),
});

// ── Step 6: Password ──────────────────────────────────────────────────────────
export const step6Schema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل'),
});

// ── Full combined schema (used for inferring the master type) ─────────────────
export const fullOnboardingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema);

export type FullOnboardingData = z.infer<typeof fullOnboardingSchema>;

// ── Profile Update Schema (Steps 2-5) ─────────────────────────────────────────
export const profileUpdateSchema = step2Schema
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// ── Step schemas array for programmatic per-step resolver lookup ──────────────
export const STEP_SCHEMAS = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
] as const;
