'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { requestPasswordReset } from '@/actions/client-actions';
import { PasswordInput } from '@/components/ui/PasswordInput';

function LoginForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  // Extract redirect target directly from the URL or fallback to the coach portal
  const redirectUrl = searchParams.get('redirect') || '/admin';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with Firebase Client SDK natively
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Extract JWT token securely
      const idToken = await userCredential.user.getIdToken();
      
      // Decode the Firebase JWT Custom Claims locally to assess role before Server redirect
      const idTokenResult = await userCredential.user.getIdTokenResult();
      const role = idTokenResult.claims.role;

      // 3. Trade it with our Server logic to forge a persistent session cookie
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error('فشل إنشاء الجلسة / Session creation failed');
      }
      
      // 4. Role-based localized routing delegation 
      // Hard refresh ensures Server Side Cookie Extraction is natively parsed by Layouts
      if (role === 'coach') {
        window.location.href = `/${locale}/admin`;
      } else {
        window.location.href = `/${locale}/client`;
      }
      
    } catch (err: any) {
      console.error('Firebase Login Blocked:', err);
      // Fallback safe error
      setError('بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.');
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSuccess('');

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setResetSuccess(t('resetSuccessMessage') || res.message);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      console.error('Reset Error:', err);
      setError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  }

  if (isForgotPassword) {
    return (
      <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-text-main mb-2">{t('forgotPasswordTitle')}</h2>
          <p className="text-sm text-text-muted">{t('forgotPasswordDesc')}</p>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-bold text-text-main mb-2">{t('email')}</label>
          <input
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className="w-full px-4 py-4 text-left rounded-xl border-2 border-border-light focus:border-qwaam-pink focus:ring-0 outline-none transition-all font-medium text-text-main bg-gray-50/50"
            placeholder="coach@qwaam.com"
          />
        </div>

        {/* Dynamic States */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center justify-center text-center shadow-sm">
            {error}
          </div>
        )}
        
        {resetSuccess && (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 flex items-center justify-center text-center shadow-sm">
            {resetSuccess}
          </div>
        )}

        <div className="flex justify-between items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => { setIsForgotPassword(false); setError(''); setResetSuccess(''); }}
            disabled={loading}
            className="inline-block text-sm font-bold text-text-muted hover:text-qwaam-pink transition-colors disabled:opacity-50"
          >
            {t('backToLogin')}
          </button>

          <button
            type="submit"
            disabled={loading || !!resetSuccess}
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-qwaam-pink px-6 py-3 text-sm font-bold text-white hover:bg-pink-600 shadow-lg shadow-qwaam-pink/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
          >
            {loading ? <span className="animate-pulse">جاري الإرسال...</span> : t('sendResetLink')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Email Input */}
      <div>
        <label className="block text-sm font-bold text-text-main mb-2">{t('email')}</label>
        <input
          type="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
          className="w-full px-4 py-4 text-left rounded-xl border-2 border-border-light focus:border-qwaam-pink focus:ring-0 outline-none transition-all font-medium text-text-main bg-gray-50/50"
          placeholder="coach@qwaam.com"
        />
      </div>

      {/* Password Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-bold text-text-main">{t('password')}</label>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setIsForgotPassword(true); setError(''); }}
            className="text-xs font-bold text-qwaam-pink hover:text-pink-600 transition-colors"
          >
            {t('forgotPasswordLink')}
          </button>
        </div>
        <PasswordInput
          required
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {/* Dynamic Error State */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center justify-center text-center shadow-sm animate-in zoom-in duration-200">
          {error}
        </div>
      )}

      {/* Execution Trigger */}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-qwaam-pink px-4 py-4 text-lg font-bold text-white hover:bg-pink-600 shadow-lg shadow-qwaam-pink/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
      >
        {loading ? <span className="animate-pulse">جاري التحقق...</span> : t('loginBtn')}
      </button>

    </form>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const tBrand = useTranslations('brand');

  return (
    <div className="min-h-screen flex items-center justify-center bg-qwaam-white relative overflow-hidden px-6">
      
      {/* Immersive Qwaam Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-qwaam-pink/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-qwaam-yellow/10 rounded-full blur-3xl pointer-events-none" />

      {/* Authentication Card */}
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl shadow-qwaam-pink/5 border border-border-light relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Brand Core Identity */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
             <Image src="/brand/logo-pink.png" alt="Qwaam" width={160} height={53} priority className="w-auto h-auto mx-auto" />
          </Link>
          <h1 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">
            {t('login')}
          </h1>
          <p className="text-text-muted font-bold text-sm">
            {tBrand('tagline')}
          </p>
        </div>

        {/* Client-side form boundaries wrapped for static export safety */}
        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-qwaam-pink border-t-transparent animate-spin" /></div>}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  );
}
