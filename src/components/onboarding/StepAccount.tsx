// src/components/onboarding/StepAccount.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField, inputCls } from './ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

export default function StepAccount() {
  const t = useTranslations('onboarding');
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
          <PasswordInput
            {...register('password')}
            placeholder={t('step6.passwordPlaceholder')}
            error={!!errors.password}
            autoComplete="new-password"
          />

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
