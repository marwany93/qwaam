// src/components/onboarding/StepGoals.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField, inputCls, CheckboxItem } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

const GOAL_KEYS = ['fatBurn', 'gainMuscle', 'gainWeight'] as const;
const SUPPLEMENT_KEYS = ['whey', 'creatine', 'preWorkout', 'vitamins', 'none'] as const;

export default function StepGoals() {
  const t = useTranslations('onboarding');
  const { watch, setValue, register, formState: { errors } } = useFormContext<FullOnboardingData>();

  const primaryGoal = watch('primaryGoal');
  const workoutDays = watch('workoutDaysPerWeek') || 3;
  const supplements: string[] = watch('currentSupplements') || [];

  function toggleSupplement(key: string) {
    if (key === 'none') {
      // Selecting "none" clears all others
      setValue('currentSupplements', ['none'], { shouldValidate: true });
      return;
    }
    const withoutNone = supplements.filter((s) => s !== 'none');
    const next = withoutNone.includes(key)
      ? withoutNone.filter((s) => s !== key)
      : [...withoutNone, key];
    setValue('currentSupplements', next.length ? next : [], { shouldValidate: true });
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-black text-text-main mb-1">{t('step4.heading')}</h2>
      </div>

      {/* Primary Goal — Icon Card Selection */}
      <FormField
        label={t('step4.goalLabel')}
        error={errors.primaryGoal?.message}
        required
      >
        <div className="grid grid-cols-1 gap-3">
          {GOAL_KEYS.map((key) => {
            const icons = { fatBurn: '🔥', gainMuscle: '💪', gainWeight: '⚡' };
            const isSelected = primaryGoal === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue('primaryGoal', key, { shouldValidate: true })}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-start transition-all ${
                  isSelected
                    ? 'bg-qwaam-pink-light border-qwaam-pink text-qwaam-pink shadow-sm'
                    : 'bg-gray-50/50 border-border-light text-text-muted hover:border-qwaam-pink/50'
                }`}
              >
                <span className="text-2xl">{icons[key]}</span>
                <span className="font-bold text-sm">{t(`step4.goals.${key}`)}</span>
                {isSelected && (
                  <span className="ms-auto w-5 h-5 rounded-full bg-qwaam-pink flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FormField>

      {/* Workout Days — Slider + Display */}
      <FormField label={`${t('step4.workoutDaysLabel')} — ${workoutDays} ${workoutDays === 1 ? 'يوم' : 'أيام'}`} required>
        <input
          type="range"
          {...register('workoutDaysPerWeek', { valueAsNumber: true })}
          min={1}
          max={7}
          step={1}
          className="w-full accent-qwaam-pink h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-xs font-bold text-text-muted mt-1 px-0.5">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <span key={d} className={d === workoutDays ? 'text-qwaam-pink' : ''}>{d}</span>
          ))}
        </div>
      </FormField>

      {/* Experience */}
      <FormField label={t('step4.experienceLabel')}>
        <textarea
          {...register('sportsExperience')}
          rows={3}
          placeholder={t('step4.experiencePlaceholder')}
          className={`${inputCls()} resize-none`}
        />
      </FormField>

      {/* Supplements */}
      <FormField
        label={t('step4.supplementsLabel')}
        error={errors.currentSupplements?.message}
        required
      >
        <div className="grid grid-cols-2 gap-2">
          {SUPPLEMENT_KEYS.map((key) => (
            <CheckboxItem
              key={key}
              id={`supp_${key}`}
              label={t(`step4.supplements.${key}`)}
              checked={supplements.includes(key)}
              onChange={() => toggleSupplement(key)}
            />
          ))}
        </div>
      </FormField>
    </div>
  );
}
