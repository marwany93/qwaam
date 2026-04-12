'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { useTranslations } from 'next-intl';

function ResetPasswordContent() {
    const t = useTranslations('auth');
    const searchParams = useSearchParams();
    const router = useRouter();
    const oobCode = searchParams.get('oobCode');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!oobCode) return setError('كود إعادة التعيين غير صالح أو منتهي.');
        if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
        if (password !== confirmPassword) return setError('كلمات المرور غير متطابقة.');

        setLoading(true);
        setError('');

        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            console.error(err);
            setError('حدث خطأ، قد يكون الرابط منتهي الصلاحية. يرجى طلب رابط جديد.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h1 className="text-2xl font-black text-center text-text-main mb-2">تغيير كلمة المرور</h1>
            <p className="text-text-muted text-center text-sm mb-8">أدخلي كلمة المرور الجديدة لحسابكِ في قوام</p>

            {success ? (
                <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-center font-bold animate-in zoom-in-95">
                    ✨ تم تغيير كلمة المرور بنجاح!
                    <br />
                    <span className="text-xs font-normal">يتم تحويلكِ لصفحة الدخول الآن...</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* حقل كلمة المرور الجديدة */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-main">كلمة المرور الجديدة</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                dir="ltr"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-qwaam-pink focus:ring-1 focus:ring-qwaam-pink outline-none transition-all text-left pe-12"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute inset-y-0 end-4 flex items-center text-gray-400 hover:text-qwaam-pink transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <PasswordStrength password={password} />
                    </div>

                    {/* حقل تأكيد كلمة المرور */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-main">تأكيد كلمة المرور</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                dir="ltr"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-qwaam-pink focus:ring-1 focus:ring-qwaam-pink outline-none transition-all text-left pe-12"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowConfirmPassword((p) => !p)}
                                className="absolute inset-y-0 end-4 flex items-center text-gray-400 hover:text-qwaam-pink transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-qwaam-pink text-white rounded-2xl font-black hover:bg-qwaam-pink-dark transition-all shadow-lg shadow-qwaam-pink/20 disabled:opacity-50"
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
            <React.Suspense fallback={<div className="animate-pulse">جاري التحميل...</div>}>
                <ResetPasswordContent />
            </React.Suspense>
        </div>
    );
}

// مكون قياس قوة الباسورد
function PasswordStrength({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
    const labels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1.5 animate-in fade-in">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>
            {score > 0 && (
                <p className={`text-xs font-bold ${colors[score].replace('bg-', 'text-')}`}>
                    كلمة المرور: {labels[score]}
                </p>
            )}
        </div>
    );
}