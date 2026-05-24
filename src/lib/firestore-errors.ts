import type { FirestoreError } from 'firebase/firestore';

/**
 * Map a Firestore listener error into a user-facing Arabic message + a
 * severity flag the caller can use to decide whether to break the UI or
 * silently swallow.
 *
 * `permission-denied` is treated as INFO not ERROR — it commonly fires
 * during sign-out (the listener races the auth state change) and during
 * legitimate access denials we don't want to surface to the user.
 */
export interface MappedError {
  isPermissionDenied: boolean;
  userMessage: string;
}

export function mapFirestoreError(err: unknown): MappedError {
  const e = err as Partial<FirestoreError> | undefined;
  const code = e?.code;

  if (code === 'permission-denied') {
    return {
      isPermissionDenied: true,
      userMessage: 'لا تملكين صلاحية الوصول لهذه البيانات.',
    };
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return {
      isPermissionDenied: false,
      userMessage: 'الاتصال بالخادم بطيء حالياً. حاولي مجدداً بعد قليل.',
    };
  }
  if (code === 'unauthenticated') {
    return {
      isPermissionDenied: true,
      userMessage: 'انتهت الجلسة. أعيدي تسجيل الدخول.',
    };
  }
  return {
    isPermissionDenied: false,
    userMessage: 'تعذّر تحميل البيانات. حاولي مجدداً.',
  };
}
