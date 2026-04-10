// src/components/onboarding/StepEmail.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
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

      <FormField
        label={t('step1.emailLabel')}
        error={errors.email?.message}
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
    </div>
  );
}
