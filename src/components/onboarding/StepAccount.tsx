// src/components/onboarding/StepAccount.tsx
'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField, inputCls } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

export default function StepAccount() {
  const t = useTranslations('onboarding');
  const [showPassword, setShowPassword] = useState(false);
  const { register, watch, formState: { errors } } = useFormContext<FullOnboardingData>();

  const email = watch('email');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main mb-1">{t('step6.heading')}</h2>
      </div>

      {/* Email — Read-only display */}
      <FormField label={t('step6.emailReadonly')}>
        <div className="px-4 py-3.5 rounded-xl border-2 border-border-light bg-gray-100 text-text-muted font-bold text-sm dir-ltr text-left">
          {email}
        </div>
      </FormField>

      {/* Password */}
      <FormField
        label={t('step6.passwordLabel')}
        error={errors.password?.message}
        hint={t('step6.passwordHint')}
        required
      >
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder={t('step6.passwordPlaceholder')}
            dir="ltr"
            className={`${inputCls(!!errors.password)} text-left pe-12`}
            autoComplete="new-password"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 end-4 flex items-center text-text-muted hover:text-qwaam-pink transition-colors"
            aria-label="Toggle password visibility"
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

        {/* Password strength indicator */}
        <PasswordStrength password={watch('password') || ''} />
      </FormField>

      {/* Final Note */}
      <div className="p-4 rounded-xl bg-qwaam-pink-light border border-qwaam-pink/20 flex items-start gap-3">
        <span className="text-xl shrink-0">🌸</span>
        <p className="text-sm font-bold text-qwaam-pink leading-relaxed">
          بمجرد الضغط على الزر، سيتم إنشاء حسابكِ وحفظ جميع بياناتكِ بشكل آمن. المدربة ستتواصل معكِ قريباً!
        </p>
      </div>
    </div>
  );
}

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
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-gray-200'
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
