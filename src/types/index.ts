import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'coach' | 'trainee';

export interface QwaamUser {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: number | Timestamp;
  traineeData?: {
    assignedCoachUid?: string;
    unreadCount?: number;
    assignedWorkouts: string[];
    assignedMeals: string[];
    // Expandable object mapping metric ID to values over time
    progress?: Record<string, any>;
  };
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string; // e.g., "10-12"
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

export interface Meal {
  id: string;
  nameAr: string;
  nameEn: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  imageUrl?: string;
  createdAt: number | Timestamp;
}

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
