"use client";

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { PasswordInput } from '@/components/ui/PasswordInput';

function ResetPasswordContent() {
    const t = useTranslations('auth');
    const searchParams = useSearchParams();
    const router = useRouter();
    const oobCode = searchParams.get('oobCode');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
                        <PasswordInput
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <PasswordStrength password={password} />
                    </div>

                    {/* حقل تأكيد كلمة المرور */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-main">تأكيد كلمة المرور</label>
                        <PasswordInput
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
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