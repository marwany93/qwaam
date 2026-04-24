import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'coach' | 'trainee';

export interface QwaamUser {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: number | Timestamp;
  sessionTracking?: {
    totalSessions: number;
    remainingSessions: number;
    planStatus: 'active' | 'finished';
    lastRenewedAt?: any;
  };
  renewalRequest?: {
    requested: boolean;
    requestedAt: any;
    status: 'pending' | 'fulfilled';
  };
  activeRoomUrl?: string | null;
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
      createdAt: string;
    } | null;
  };
}

// ── Exercise Pool ──────────────────────────────────────────────────────────────
// The atomic building block library — individual movements the coach curates.

export type TargetMuscle =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Core'
  | 'Arms'
  | 'Shoulders'
  | 'Glutes'
  | 'Full Body';

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
  defaultSets: number;
  defaultReps: string; // e.g., "10-12" or "AMRAP"
  defaultWeightLevel: WeightLevel;
  defaultRest: number; // seconds
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

// ── Discount / Gamification ───────────────────────────────────────────────────


export interface DiscountLead {
  email: string;
  phone: string;
  discountPercentage: number;
  createdAt: number | Timestamp;
}

