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

  // مراقبة هل تم اختيار الغدة أو أخرى
  const isThyroidSelected = chronicDiseases.includes('thyroid');
  const isOtherSelected = chronicDiseases.includes('other');

  function toggleChronic(key: string) {
    const next = chronicDiseases.includes(key)
      ? chronicDiseases.filter((k) => k !== key)
      : [...chronicDiseases, key];
    setValue('chronicDiseases', next, { shouldValidate: true });

    // تنظيف الحقول الفرعية لو المستخدم لغى التحديد
    if (key === 'thyroid' && chronicDiseases.includes('thyroid')) {
      setValue('thyroidStatus', undefined);
    }
    if (key === 'other' && chronicDiseases.includes('other')) {
      setValue('otherDiseaseDetails', undefined);
    }
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
            if (!val) {
              setValue('chronicDiseases', []);
              setValue('thyroidStatus', undefined);
              setValue('otherDiseaseDetails', undefined);
            }
          }}
          yesLabel={t('step3.yes')}
          noLabel={t('step3.no')}
        />
      </FormField>

      {hasChronicDiseases && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-2">
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

          {/* حقل حالة الغدة الدرقية */}
          {isThyroidSelected && (
            <div className="p-4 bg-gray-50/80 rounded-xl border border-border-light animate-in fade-in zoom-in-95 duration-200">
              <FormField label={t('step3.thyroidStatusLabel')}>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="active"
                      {...register('thyroidStatus')}
                      className="w-4 h-4 text-qwaam-pink border-gray-300 focus:ring-qwaam-pink"
                    />
                    <span className="text-sm font-bold text-text-main">{t('step3.thyroidActive')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="inactive"
                      {...register('thyroidStatus')}
                      className="w-4 h-4 text-qwaam-pink border-gray-300 focus:ring-qwaam-pink"
                    />
                    <span className="text-sm font-bold text-text-main">{t('step3.thyroidInactive')}</span>
                  </label>
                </div>
              </FormField>
            </div>
          )}

          {/* حقل تفاصيل المرض الآخر */}
          {isOtherSelected && (
            <div className="p-4 bg-gray-50/80 rounded-xl border border-border-light animate-in fade-in zoom-in-95 duration-200">
              <FormField
                label={t('step3.otherDiseaseLabel')}
                error={errors.otherDiseaseDetails?.message}
              >
                <input
                  type="text"
                  {...register('otherDiseaseDetails')}
                  placeholder={t('step3.otherDiseasePlaceholder')}
                  className={inputCls(!!errors.otherDiseaseDetails)}
                />
              </FormField>
            </div>
          )}
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