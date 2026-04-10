// src/components/onboarding/StepPersonal.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField, inputCls, CheckboxItem } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

export default function StepPersonal() {
  const t = useTranslations('onboarding');
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FullOnboardingData>();

  const maritalStatus = watch('maritalStatus');
  const isMarried = maritalStatus === 'married';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main mb-1">{t('step2.heading')}</h2>
      </div>

      {/* Full Name */}
      <FormField
        label={t('step2.nameLabel')}
        error={errors.name?.message}
        required
      >
        <input
          type="text"
          {...register('name')}
          placeholder={t('step2.namePlaceholder')}
          className={inputCls(!!errors.name)}
          autoComplete="name"
        />
      </FormField>

      {/* Date of Birth */}
      <FormField
        label={t('step2.dobLabel')}
        error={errors.dateOfBirth?.message}
        required
      >
        <input
          type="date"
          {...register('dateOfBirth')}
          className={`${inputCls(!!errors.dateOfBirth)}`}
          dir="ltr"
          max={new Date().toISOString().split('T')[0]}
        />
      </FormField>

      {/* Phone */}
      <FormField
        label={t('step2.phoneLabel')}
        error={errors.phone?.message}
        required
      >
        <input
          type="tel"
          {...register('phone')}
          placeholder={t('step2.phonePlaceholder')}
          dir="ltr"
          className={`${inputCls(!!errors.phone)} text-left`}
          autoComplete="tel"
        />
      </FormField>

      {/* Marital Status — Radio Group */}
      <FormField label={t('step2.maritalLabel')} required>
        <div className="flex gap-3">
          {(['single', 'married'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setValue('maritalStatus', status, { shouldValidate: true })}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                maritalStatus === status
                  ? 'bg-qwaam-pink text-white border-qwaam-pink shadow-md shadow-qwaam-pink/20'
                  : 'bg-gray-50 text-text-muted border-border-light hover:border-qwaam-pink/50'
              }`}
            >
              {t(`step2.${status}`)}
            </button>
          ))}
        </div>
      </FormField>

      {/* Conditional: Marriage-related checkboxes */}
      {isMarried && (
        <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {(
            [
              { key: 'isPregnant', label: t('step2.pregnantLabel') },
              { key: 'isNursing', label: t('step2.nursingLabel') },
              { key: 'hasChildren', label: t('step2.hasChildrenLabel') },
            ] as const
          ).map(({ key, label }) => (
            <CheckboxItem
              key={key}
              id={key}
              label={label}
              checked={!!watch(key)}
              onChange={(checked) => setValue(key, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
