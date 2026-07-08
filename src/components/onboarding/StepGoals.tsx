// src/components/onboarding/StepGoals.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormField, inputCls, CheckboxItem } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

const GOAL_KEYS = ['fatBurn', 'gainMuscle', 'gainWeight'] as const;
const SUPPLEMENT_KEYS = ['whey', 'creatine', 'preWorkout', 'vitamins', 'none'] as const;

const MAX_GUIDE_PHOTOS = 5;

export default function StepGoals({ maxWorkoutDays = 7 }: { maxWorkoutDays?: number }) {
  const t = useTranslations('onboarding');
  const { watch, setValue, register, formState: { errors } } = useFormContext<FullOnboardingData>();

  const primaryGoal = watch('primaryGoal');
  const workoutDays = watch('workoutDaysPerWeek') || 3;
  const supplements: string[] = watch('currentSupplements') || [];
  const trainedBefore = watch('trainedBefore') ?? false;
  const guideFiles = watch('previousGuidesFiles') as FileList | undefined;
  // Cap the preview at MAX_GUIDE_PHOTOS — the same cap the upload loop enforces.
  const guidePreviews = guideFiles
    ? Array.from(guideFiles).slice(0, MAX_GUIDE_PHOTOS)
    : [];

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

  // تحديد هل الباقة "محددة الأيام" (جدول) أم "مفتوحة" (لايف)
  const isFixedDaysPlan = maxWorkoutDays < 7;

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
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-start transition-all ${isSelected
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

      {/* Workout Days — Smart Logic Display */}
      {isFixedDaysPlan ? (
        // حالة الباقة المحددة (جدول) -> عرض كارت غير قابل للتعديل
        <FormField label={t('step4.workoutDaysLabel')}>
          <div className="bg-qwaam-pink-light/30 border-2 border-qwaam-pink/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-qwaam-pink/30 text-qwaam-pink flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
              {maxWorkoutDays}
            </div>
            <p className="text-sm font-bold text-gray-700 leading-relaxed">
              بناءً على باقتك المختارة، جدولك التدريبي مخصص لـ <span className="text-qwaam-pink font-black">{maxWorkoutDays === 2 ? 'يومين' : `${maxWorkoutDays} أيام`}</span> أسبوعياً.
            </p>
          </div>
        </FormField>
      ) : (
        // حالة الباقة المفتوحة -> عرض الـ Slider العادي
        <FormField label={`${t('step4.workoutDaysLabel')} — ${workoutDays} ${workoutDays === 1 ? 'يوم' : 'أيام'}`} required>
          <input
            type="range"
            {...register('workoutDaysPerWeek', { valueAsNumber: true })}
            min={1}
            max={maxWorkoutDays}
            step={1}
            className="w-full accent-qwaam-pink h-2 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-xs font-bold text-text-muted mt-1 px-0.5">
            {Array.from({ length: maxWorkoutDays }, (_, i) => i + 1).map((d) => (
              <span key={d} className={d === workoutDays ? 'text-qwaam-pink' : ''}>{d}</span>
            ))}
          </div>
        </FormField>
      )}

      {/* Experience */}
      <FormField label={t('step4.experienceLabel')}>
        <textarea
          {...register('sportsExperience')}
          rows={3}
          placeholder={t('step4.experiencePlaceholder')}
          className={`${inputCls()} resize-none`}
        />
      </FormField>

      {/* Trained before? — Yes/No + optional previous-guide photos */}
      <FormField label={t('step4.trainedBeforeLabel')}>
        <div data-testid="trained-before-question" className="grid grid-cols-2 gap-3">
          {[
            { val: true, label: t('step4.trainedBeforeYes') },
            { val: false, label: t('step4.trainedBeforeNo') },
          ].map(({ val, label }) => {
            const isSelected = trainedBefore === val;
            return (
              <button
                key={String(val)}
                type="button"
                data-testid={`trained-before-${val ? 'yes' : 'no'}`}
                onClick={() => {
                  setValue('trainedBefore', val, { shouldValidate: true });
                  // Switching to "no" clears any picked guide files.
                  if (!val) {
                    setValue('previousGuidesFiles', undefined as any);
                    setValue('previousGuidesPhotos', []);
                  }
                }}
                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${isSelected
                  ? 'bg-qwaam-pink-light border-qwaam-pink text-qwaam-pink shadow-sm'
                  : 'bg-gray-50/50 border-border-light text-text-muted hover:border-qwaam-pink/50'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FormField>

      {/* Optional multi-photo picker — only when trained before === yes */}
      {trainedBefore && (
        <FormField label={t('step4.previousGuidesLabel')} hint={t('step4.previousGuidesHint')}>
          <div data-testid="previous-guides-uploader" className="space-y-3">
            <label className="relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border-light bg-gray-50/50 hover:border-qwaam-pink/50 hover:bg-qwaam-pink-light/20 cursor-pointer transition-all">
              <span className="text-3xl">🗂️</span>
              <span className="text-sm font-bold text-text-muted text-center">
                (اختياري) اضغطي لاختيار الصور — حتى {MAX_GUIDE_PHOTOS}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                {...register('previousGuidesFiles')}
              />
            </label>

            {guidePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {guidePreviews.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border-light bg-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>
      )}

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