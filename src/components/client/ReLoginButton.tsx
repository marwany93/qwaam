'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

/**
 * Last-resort recovery button for corrupted session cookies. Common on
 * Vercel after a long idle period — the qwaam_session cookie expires but
 * the client-side Firebase auth state is stale, so every server-action
 * call returns null and the dashboard shows the "Unstable connection"
 * fallback. Clearing both states forces a clean re-auth.
 */
export default function ReLoginButton() {
  const [working, setWorking] = useState(false);

  const handleReLogin = async () => {
    setWorking(true);
    try {
      // 1. Server: delete the qwaam_session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete server session:', e);
    }
    try {
      // 2. Client: clear the Firebase auth state (clears localStorage/indexedDB)
      await signOut(auth);
    } catch (e) {
      console.warn('Failed to sign out client SDK:', e);
    }
    // 3. Hard navigation — drops any in-memory React state and re-runs the
    // app shell from scratch with no cookie + no auth state.
    window.location.href = '/login';
  };

  return (
    <button
      type="button"
      onClick={handleReLogin}
      disabled={working}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-qwaam-pink text-white font-black text-sm shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {working ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          جاري تسجيل الخروج...
        </>
      ) : (
        <>
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          تسجيل الدخول مجدداً
        </>
      )}
    </button>
  );
}
