'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// ── Context Shape ────────────────────────────────────────────────────────────
interface FirebaseContextValue {
  /** The current Firebase Auth user, or null if not logged in */
  user: User | null;
  /** True during the initial auth state resolution */
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  loading: true,
});

// ── Provider ─────────────────────────────────────────────────────────────────
/**
 * FirebaseProvider — Client Component
 *
 * Wraps the app to provide reactive auth state to any client component.
 * Place this inside NextIntlClientProvider in the locale layout.
 *
 * Usage:
 *   const { user, loading } = useFirebase();
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useFirebase(): FirebaseContextValue {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a <FirebaseProvider>');
  }
  return context;
}
