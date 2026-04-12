// src/components/onboarding/StepEmail.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { FormField, inputCls } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

interface Props {
  isChecking: boolean;
}

export default function StepEmail({ isChecking }: Props) {
  const t = useTranslations('onboarding');
  const {
    register,
    formState: { errors },
  } = useFormContext<FullOnboardingData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main mb-1">{t('step1.heading')}</h2>
        <p className="text-text-muted font-medium text-sm">{t('step1.subheading')}</p>
      </div>

      <div className="space-y-4">
        <FormField
          label={t('step1.emailLabel')}
          error={errors.email?.type === 'manual' ? undefined : errors.email?.message}
          required
        >
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder={t('step1.emailPlaceholder')}
              dir="ltr"
              className={`${inputCls(!!errors.email)} text-left ltr:placeholder:text-left rtl:placeholder:text-right`}
              autoComplete="email"
              autoFocus
            />
            {isChecking && (
              <div className="absolute inset-y-0 end-4 flex items-center">
                <div className="w-4 h-4 rounded-full border-2 border-qwaam-pink border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </FormField>

        {/* Custom Prominent CTA if Email Exists */}
        {errors.email?.type === 'manual' && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <span className="text-sm text-blue-900 font-bold leading-tight">
              {errors.email.message}
            </span>
            <Link 
              href="/login" 
              className="shrink-0 ms-4 text-xs font-black text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              الانتقال لتسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
