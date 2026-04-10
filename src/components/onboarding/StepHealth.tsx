// src/components/onboarding/StepHealth.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField, inputCls, BooleanToggle, CheckboxItem } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

const CHRONIC_KEYS = [
  'diabetes',
  'anemia',
  'stomachGerms',
  'colon',
  'stomachUlcers',
  'insulinResistance',
  'pcos',
  'thyroid',
  'heart',
  'other',
] as const;

export default function StepHealth() {
  const t = useTranslations('onboarding');
  const { watch, setValue, register, formState: { errors } } = useFormContext<FullOnboardingData>();

  const hasInjuries = watch('hasInjuries');
  const hasChronicDiseases = watch('hasChronicDiseases');
  const isSmoker = watch('isSmoker');
  const chronicDiseases: string[] = watch('chronicDiseases') || [];

  function toggleChronic(key: string) {
    const next = chronicDiseases.includes(key)
      ? chronicDiseases.filter((k) => k !== key)
      : [...chronicDiseases, key];
    setValue('chronicDiseases', next, { shouldValidate: true });
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-black text-text-main mb-1">{t('step3.heading')}</h2>
      </div>

      {/* Injuries */}
      <FormField label={t('step3.injuriesQuestion')} required>
        <BooleanToggle
          value={!!hasInjuries}
          onChange={(val) => setValue('hasInjuries', val, { shouldValidate: true })}
          yesLabel={t('step3.yes')}
          noLabel={t('step3.no')}
        />
      </FormField>

      {hasInjuries && (
        <FormField
          label={t('step3.injuriesDetails')}
          error={errors.injuryDetails?.message}
        >
          <textarea
            {...register('injuryDetails')}
            rows={3}
            placeholder={t('step3.injuriesPlaceholder')}
            className={`${inputCls(!!errors.injuryDetails)} resize-none`}
          />
        </FormField>
      )}

      {/* Chronic Diseases */}
      <FormField label={t('step3.chronicQuestion')} required>
        <BooleanToggle
          value={!!hasChronicDiseases}
          onChange={(val) => {
            setValue('hasChronicDiseases', val, { shouldValidate: true });
            if (!val) setValue('chronicDiseases', []);
          }}
          yesLabel={t('step3.yes')}
          noLabel={t('step3.no')}
        />
      </FormField>

      {hasChronicDiseases && (
        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {CHRONIC_KEYS.map((key) => (
            <CheckboxItem
              key={key}
              id={`chronic_${key}`}
              label={t(`step3.chronicOptions.${key}`)}
              checked={chronicDiseases.includes(key)}
              onChange={() => toggleChronic(key)}
            />
          ))}
        </div>
      )}

      {/* Smoking */}
      <FormField label={t('step3.smokingQuestion')} required>
        <BooleanToggle
          value={!!isSmoker}
          onChange={(val) => setValue('isSmoker', val, { shouldValidate: true })}
          yesLabel={t('step3.yes')}
          noLabel={t('step3.no')}
        />
      </FormField>
    </div>
  );
}
