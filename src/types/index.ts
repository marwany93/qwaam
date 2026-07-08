import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'coach' | 'trainee';

/**
 * Post-serialization shape — every Firestore Timestamp has already been
 * converted to a plain number (millis) by serializeFirestoreData() before
 * any user object reaches Client Components. Don't widen these date fields
 * back to `any` or `Timestamp`; doing so silently re-introduces the
 * "Only plain objects can be passed to Client Components" error.
 */
export interface QwaamUser {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: number;                       // millis
  sessionTracking?: {
    totalSessions: number;
    remainingSessions: number;
    planStatus: 'active' | 'finished';
    lastRenewedAt?: number;                // millis
  };
  renewalRequest?: {
    requested: boolean;
    requestedAt?: number;                  // millis
    status: 'pending' | 'fulfilled';
  };
  activeRoomUrl?: string | null;
  // Onboarding answers the trainee entered at signup (or the coach entered on
  // their behalf via addClient). Display-only for the coach. All fields are
  // optional — older trainees may not carry every field. See OnboardingData.
  onboarding?: OnboardingData;
  traineeData?: {
    assignedCoachUid?: string;
    unreadCount?: number;
    assignedWorkouts: string[];
    assignedMeals: string[];
    progress?: Record<string, any>;
    subscription?: {
      planId: string;
      amountPaid: string;
      dietAdded: boolean;
      status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
      createdAt: string;                   // ISO string (set client-side at submit)
      activatedAt?: number;                // millis — set by confirmTraineePayment
      paymentScreenshotUrl?: string;
      paymentScreenshotAt?: number;        // millis — set by updatePaymentScreenshot
      // ── Month-based Schedule plans (duration model) ──────────────────────────
      // Only present on Schedule plans that have moved to the duration model.
      // Absent (or 'session') = legacy session-count model (grandfathered).
      billingModel?: 'session' | 'duration';
      scheduleStartAt?: number | null;     // millis — day coach uploads schedule; null = awaiting upload
      scheduleEndsAt?: number | null;      // millis — addOneMonth(scheduleStartAt); null until anchored
      renewalReminderSentAt?: number | null; // millis — dedupes the 7-day reminder; reset to null on renewal
    } | null;
  };
}

// ── Progress Tracking ──────────────────────────────────────────────────────────
// Trainee-logged measurements + photos over time. Distinct from the daily
// workout/meal completion logs in `progress_logs` — those track adherence,
// this tracks body composition changes.

export interface ProgressEntry {
  id: string;
  traineeUid: string;
  date: number;                  // millis
  weight: number;                // kg
  bodyFat?: number;              // %
  measurements?: {
    chest?: number;              // cm
    waist?: number;
    abs?: number;
    glutes?: number;
    thighs?: number;
  };
  photos?: {
    frontUrl?: string;
    sideUrl?: string;
    backUrl?: string;
  };
  notes?: string;
}

// ── Meal Plans ─────────────────────────────────────────────────────────────────
// Coach-built single- or multi-day meal programs. Rows are authored either
// manually (coach types the food + macros) or prefilled from a saved/Spoonacular
// meal. Each row carries FULL macros so the client table needs no extra lookups.

export interface MealPlanMealRow {
  id: string;               // Stable per-row id (generated once at save time).
                            // Keys adherence logs as `plan:{planId}:{id}` — never
                            // reuse a meal-document id for this.
  mealType: MealType;       // breakfast | lunch | dinner | snack
  description: string;      // "What you eat" — free text the coach types
  calories: number;
  protein: number;          // grams
  carbs: number;            // grams
  fats: number;             // grams — plural, canonical (matches Meal.macros.fats)
  source?: 'manual' | 'spoonacular' | 'library';
  savedMealId?: string;     // Optional back-reference to a custom_meals doc
  // ── Legacy (pre-enrichment) rows ──────────────────────────────────────────
  // Old rows stored { mealType, savedMealId, mealName, calories } with no
  // macros/description. Readers normalize via normalizeMealRow():
  //   description ?? mealName ?? '—', and any missing macro → 0.
  mealName?: string;
}

export interface MealPlanDay {
  dayName: string;          // e.g., "Day 1" or "Monday"
  meals: MealPlanMealRow[];
}

export interface MealPlan {
  id: string;
  coachUid: string;
  assignedTo: string;       // trainee uid — required by hardened Firestore rules
  name: string;
  description?: string;
  days: MealPlanDay[];
  totalCalories: number;    // Sum across all days/meals — computed server-side
  // Intermittent-fasting eating window (optional, plan-level). "HH:MM" 24h.
  // Fasting hours are computed for display (24 − window length), not stored.
  eatingWindow?: { start: string; end: string } | null;
  createdAt: number;        // Millis (Firestore Timestamp toMillis)
}

// ── Exercise Pool ──────────────────────────────────────────────────────────────
// The atomic building block library — individual movements the coach curates.

export type TargetMuscle =
  // ── Canonical taxonomy (see MUSCLE_ORDER in src/lib/exercise-taxonomy.ts) ──
  | 'Chest'
  | 'Back'
  | 'Trapezius'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Abs'
  | 'Core'
  | 'Glutes'
  | 'Quadriceps'
  | 'Hamstrings'
  | 'Adductors'
  | 'Abductors'
  | 'Calves'
  | 'Full Body'
  | 'Cardio'
  // ── Legacy (deprecated) — kept so existing exercise docs stay valid. NOT
  //    offered in the add/edit dropdown; re-tagged by coaches over time. ──
  | 'Legs'
  | 'Arms';

export type Equipment =
  | 'Bodyweight'
  | 'Dumbbell'
  | 'Barbell'
  | 'Machine'
  | 'Cable'
  | 'Resistance Band'
  | 'Kettlebell';

export type WeightLevel = 'bodyweight' | 'light' | 'medium' | 'heavy' | 'max';

export interface Exercise {
  id: string;
  nameAr: string;
  nameEn: string;
  targetMuscle: TargetMuscle;
  equipment: Equipment;
  videoUrl?: string; // YouTube / Shorts link
  // Per-exercise training defaults are OPTIONAL (Issue #7): the library is a
  // catalog — sets/reps/weight/rest are entered per-workout in the workout
  // builder. Existing exercises keep these (grandfathered); new ones omit them.
  defaultSets?: number;
  defaultReps?: string; // e.g., "10-12" or "AMRAP"
  defaultWeightLevel?: WeightLevel;
  defaultRest?: number; // seconds
  createdAt: number | Timestamp;
}

// ── Workout Routines ───────────────────────────────────────────────────────────
// A Workout is a named routine built from Exercise pool references.
// The coach can override any Exercise default at the workout level.

export interface WorkoutExercise {
  exerciseId: string;   // Reference → exercises/{id}
  // Resolved at read-time from the exercises collection (not stored in Firestore)
  nameAr?: string;
  videoUrl?: string;
  // Coach overrides (fall back to Exercise.default* if omitted)
  sets?: number;
  reps?: string;
  weightLevel?: WeightLevel;
  rest?: number;        // seconds
  notes?: string;
}

export interface Workout {
  id: string;
  titleAr: string;
  titleEn: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  exercises: WorkoutExercise[];
  createdAt: number | Timestamp;
}

// ── Meals ─────────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  nameAr: string;
  nameEn: string;
  type: MealType;
  calories: number;
  macros: {           // Required — no optional here
    protein: number;
    carbs: number;
    fats: number;
  };
  recipe?: string;    // Optional ingredients / instructions
  imageUrl?: string;
  createdAt: number | Timestamp;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatId: string; // Ordered format e.g., coachUid_traineeUid
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number | Timestamp;
}

// ── Onboarding Wizard ─────────────────────────────────────────────────────────

export type MaritalStatus = 'single' | 'married';
export type PrimaryGoal = 'fatBurn' | 'gainMuscle' | 'gainWeight';

// ── Stored onboarding shape (users/{uid}.onboarding) ──────────────────────────
// This is what actually lands in Firestore under the `onboarding` key (built by
// OnboardingWizard / addClient) — a subset of OnboardingFormData with the file
// inputs replaced by uploaded URLs. Every field is optional so the coach-facing
// RegistrationCard can render older docs that predate a given field. This type
// is DISPLAY support only — it does not change how onboarding is stored.
export interface OnboardingData {
  // Personal (Step 2)
  dateOfBirth?: string;
  phone?: string;
  maritalStatus?: MaritalStatus;
  isPregnant?: boolean;
  isNursing?: boolean;
  hasChildren?: boolean;
  // Health (Step 3)
  hasInjuries?: boolean;
  injuryDetails?: string;
  hasChronicDiseases?: boolean;
  chronicDiseases?: string[];
  isSmoker?: boolean;
  // Goals & Training (Step 4)
  primaryGoal?: PrimaryGoal;
  workoutDaysPerWeek?: number;
  sportsExperience?: string;
  currentSupplements?: string[];
  trainedBefore?: boolean;
  previousGuidesPhotos?: string[];
  // Body / InBody (Step 5)
  weight?: number;
  height?: number;
  bodyDescription?: string;
  inbodyUrl?: string;
  bodyPhotoUrl?: string;
  measurements?: {
    chest?: number;
    shoulders?: number;
    waist?: number;
    abdomen?: number;
    glutes?: number;
    rightThigh?: number;
    leftThigh?: number;
    rightCalf?: number;
    leftCalf?: number;
    rightArm?: number;
    leftArm?: number;
  };
}

export interface OnboardingFormData {
  // Step 1
  email: string;
  // Step 2
  name: string;
  dateOfBirth: string;
  phone: string;
  maritalStatus: MaritalStatus;
  isPregnant?: boolean;
  isNursing?: boolean;
  hasChildren?: boolean;
  // Step 3
  hasInjuries: boolean;
  injuryDetails?: string;
  hasChronicDiseases: boolean;
  chronicDiseases?: string[];
  isSmoker: boolean;
  // Step 4
  primaryGoal: PrimaryGoal;
  workoutDaysPerWeek: number;
  sportsExperience?: string;
  currentSupplements: string[];
  trainedBefore?: boolean;            // "هل تدربت قبل ذلك؟" — optional (defaults false)
  previousGuidesFiles?: FileList;     // transport-only (like inbodyFile) — not persisted
  previousGuidesPhotos?: string[];    // uploaded guide-photo URLs — persisted under onboarding.previousGuidesPhotos
  // Step 5
  weight: number;
  height: number;
  bodyDescription: string;
  inbodyFile: FileList;
  bodyPhotoFile?: FileList;
  measurements?: {
    chest?: number;
    shoulders?: number;
    waist?: number;
    abdomen?: number;
    glutes?: number;
    rightThigh?: number;
    leftThigh?: number;
    rightCalf?: number;
    leftCalf?: number;
    rightArm?: number;
    leftArm?: number;
  };
  // Step 6
  password: string;
}

// ── Renewal Requests ──────────────────────────────────────────────────────────
// Written by the trainee after choosing a plan + uploading proof; read by
// the admin to pre-fill PendingPaymentCard without re-entering values.

export interface RenewalRequest {
  id: string;
  traineeUid: string;
  planId: string;
  amount: number;        // EGP — denormalized from plan.price at request time
  proofUrl: string;
  status: 'pending' | 'fulfilled';
  createdAt: number;     // millis
}

// ── Discount / Gamification ───────────────────────────────────────────────────


export interface DiscountLead {
  email: string;
  phone: string;
  discountPercentage: number;
  createdAt: number | Timestamp;
}

