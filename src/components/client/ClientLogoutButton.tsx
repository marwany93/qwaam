'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function ClientLogoutButton() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    
    try {
      // 1. Terminate native Firebase Client Session
      await signOut(auth);
      
      // 2. Securely destroy HTTP Only cookie via the backend pipeline
      await fetch('/api/auth/session', { method: 'DELETE' });
      
      // 3. Execution boundary: Hard redirection enforcing localized fallback
      window.location.href = `/${locale}/login`;
    } catch (error) {
      console.error('Logout failed:', error);
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="text-sm font-bold text-text-muted hover:text-qwaam-pink px-3 py-1.5 rounded-lg hover:bg-qwaam-pink-light/30 transition-all disabled:opacity-50"
    >
      {loading ? 'جاري الخروج...' : 'تسجيل الخروج'}
    </button>
  );
}
