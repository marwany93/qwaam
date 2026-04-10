// src/components/onboarding/StepBody.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FormField, inputCls } from './ui/FormField';
import type { FullOnboardingData } from '@/lib/onboarding-schema';

const MEASUREMENT_KEYS = [
  'chest',
  'shoulders',
  'waist',
  'abdomen',
  'glutes',
  'rightThigh',
  'leftThigh',
  'rightCalf',
  'leftCalf',
  'rightArm',
  'leftArm',
] as const;

interface FilePreviewProps {
  label: string;
  hint: string;
  name: 'inbodyFile' | 'bodyPhotoFile';
  required?: boolean;
  error?: string;
}

function FileUploadBox({ label, hint, name, required, error }: FilePreviewProps) {
  const { register, watch } = useFormContext<FullOnboardingData>();
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <label
        className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          error
            ? 'border-red-400 bg-red-50/30'
            : preview
            ? 'border-qwaam-pink bg-qwaam-pink-light/50'
            : 'border-border-light bg-gray-50/50 hover:border-qwaam-pink/50 hover:bg-qwaam-pink-light/20'
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="max-h-36 rounded-lg object-contain shadow-sm"
          />
        ) : (
          <>
            <span className="text-4xl">{name === 'inbodyFile' ? '📊' : '📸'}</span>
            <span className="text-sm font-bold text-text-muted text-center">
              {required ? '(مطلوب) ' : '(اختياري) '}اضغطي لاختيار الملف
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          {...register(name, {
            onChange: (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPreview(URL.createObjectURL(file));
              }
            },
          })}
        />
      </label>
    </FormField>
  );
}

export default function StepBody() {
  const t = useTranslations('onboarding');
  const [showMeasurements, setShowMeasurements] = useState(false);
  const { register, formState: { errors } } = useFormContext<FullOnboardingData>();

  const inbodyError = (errors as any).inbodyFile?.message as string | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-text-main mb-1">{t('step5.heading')}</h2>
      </div>

      {/* Weight & Height */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('step5.weightLabel')}
          error={errors.weight?.message}
          required
        >
          <input
            type="number"
            {...register('weight', { valueAsNumber: true })}
            placeholder="65"
            dir="ltr"
            className={`${inputCls(!!errors.weight)} text-center`}
            min={20}
            max={300}
          />
        </FormField>
        <FormField
          label={t('step5.heightLabel')}
          error={errors.height?.message}
          required
        >
          <input
            type="number"
            {...register('height', { valueAsNumber: true })}
            placeholder="165"
            dir="ltr"
            className={`${inputCls(!!errors.height)} text-center`}
            min={100}
            max={250}
          />
        </FormField>
      </div>

      {/* Body Description */}
      <FormField
        label={t('step5.bodyDescLabel')}
        error={errors.bodyDescription?.message}
        required
      >
        <textarea
          {...register('bodyDescription')}
          rows={3}
          placeholder={t('step5.bodyDescPlaceholder')}
          className={`${inputCls(!!errors.bodyDescription)} resize-none`}
        />
      </FormField>

      {/* InBody Upload */}
      <FileUploadBox
        name="inbodyFile"
        label={t('step5.inbodyLabel')}
        hint={t('step5.inbodyHint')}
        required
        error={inbodyError}
      />

      {/* Body Photo Upload */}
      <FileUploadBox
        name="bodyPhotoFile"
        label={t('step5.photoLabel')}
        hint={t('step5.photoHint')}
      />

      {/* Measurements Collapsible */}
      <div className="rounded-2xl border-2 border-border-light overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMeasurements((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/80 hover:bg-gray-100/80 transition-all"
        >
          <span className="font-bold text-sm text-text-main">{t('step5.measurementsTitle')}</span>
          <span className={`text-text-muted transition-transform duration-200 ${showMeasurements ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {showMeasurements && (
          <div className="p-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {MEASUREMENT_KEYS.map((key) => (
              <FormField key={key} label={`${t(`step5.measurements.${key}`)} (${t('step5.unit')})`}>
                <input
                  type="number"
                  {...register(`measurements.${key}`, { valueAsNumber: true })}
                  placeholder="0"
                  dir="ltr"
                  className={`${inputCls()} text-center`}
                  min={0}
                />
              </FormField>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
