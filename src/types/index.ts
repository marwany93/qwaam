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
