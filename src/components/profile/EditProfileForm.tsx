// src/components/profile/EditProfileForm.tsx
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { updateTraineeProfile } from '@/actions/client-actions';
import { profileUpdateSchema, type ProfileUpdateData } from '@/lib/onboarding-schema';
import { FormField, inputCls, BooleanToggle, CheckboxItem } from '@/components/onboarding/ui/FormField';

interface Props {
  uid: string;
  defaultData: any;
  currentInbody?: string;
  currentPhoto?: string;
}

const MEASUREMENT_KEYS = ['chest', 'shoulders', 'waist', 'abdomen', 'glutes', 'rightThigh', 'leftThigh', 'rightCalf', 'leftCalf', 'rightArm', 'leftArm'] as const;
const GOALS = ['fatBurn', 'gainMuscle', 'gainWeight'] as const;

export default function EditProfileForm({ uid, defaultData, currentInbody, currentPhoto }: Props) {
  const t = useTranslations();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const methods = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema as any),
    defaultValues: {
      ...defaultData,
      // Provide defaults for empty stuff just in case
      measurements: defaultData.measurements || {},
      chronicDiseases: defaultData.chronicDiseases || [],
      currentSupplements: defaultData.currentSupplements || [],
      // Clear file inputs initially
      inbodyFile: undefined,
      bodyPhotoFile: undefined,
    },
    mode: 'onTouched',
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  // Watchers for conditional logic
  const maritalStatus = watch('maritalStatus');
  const isMarried = maritalStatus === 'married';
  const hasInjuries = watch('hasInjuries');
  const hasChronicDiseases = watch('hasChronicDiseases');
  
  // Custom file upload handler
  async function uploadFile(file: File, name: string): Promise<string> {
    const storageRef = ref(storage, `trainee_uploads/${uid}/${name}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function onSubmit(data: ProfileUpdateData) {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Process files if they exist
      let newInbodyUrl = defaultData.inbodyUrl;
      let newPhotoUrl = defaultData.bodyPhotoUrl;

      if (data.inbodyFile?.[0]) {
        newInbodyUrl = await uploadFile(data.inbodyFile[0], 'inbody');
      }
      if (data.bodyPhotoFile?.[0]) {
        newPhotoUrl = await uploadFile(data.bodyPhotoFile[0], 'body_photo');
      }

      // 2. Map data
      const payload = {
        ...data,
        inbodyUrl: newInbodyUrl,
        bodyPhotoUrl: newPhotoUrl,
      };

      // Don't save the raw FileList objects to Firestore
      delete payload.inbodyFile;
      delete payload.bodyPhotoFile;

      // 3. Server action
      await updateTraineeProfile(uid, payload);
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/client/profile');
        router.refresh();
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg(t('profile.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // File Input Preview Helper
  function FileUploadBox({ name, label, currentUrl }: { name: 'inbodyFile' | 'bodyPhotoFile', label: string, currentUrl?: string }) {
    const [preview, setPreview] = useState<string | null>(null);
    return (
      <div className="space-y-2">
        <label className="text-sm font-bold text-text-main">{label}</label>
        <label className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            preview || currentUrl ? 'border-border-light bg-gray-50/50 hover:border-qwaam-pink/50' : 'border-border-light bg-gray-50/50 hover:border-qwaam-pink/50'
          }`}
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-36 rounded-lg shadow-sm" />
          ) : currentUrl ? (
            <div className="text-center">
              <span className="text-sm font-bold text-qwaam-pink">{t('profile.uploadNewImage')}</span>
              <p className="text-xs text-text-muted mt-1">{t('profile.keepExisting')}</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-sm font-bold text-text-muted">{t('profile.uploadNewImage')}</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            {...register(name, {
              onChange: (e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              },
            })}
          />
        </label>
      </div>
    );
  }

  if (success) {
    return (
      <div className="py-24 text-center animate-in zoom-in duration-300 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl">✅</div>
        <h2 className="text-2xl font-black text-text-main">{t('profile.updateSuccess')}</h2>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 font-bold border border-red-100 text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-8">
          
          {/* ====== Personal Info ====== */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-qwaam-pink border-b border-border-light pb-2">{t('profile.personal')}</h3>
            <FormField label={t('profile.name')} error={errors.name?.message} required>
              <input type="text" {...register('name')} className={inputCls(!!errors.name)} />
            </FormField>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('profile.dob')} error={errors.dateOfBirth?.message} required>
                <input type="date" {...register('dateOfBirth')} className={inputCls(!!errors.dateOfBirth)} dir="ltr" max={new Date().toISOString().split('T')[0]} />
              </FormField>
              <FormField label={t('profile.phone')} error={errors.phone?.message} required>
                <input type="tel" {...register('phone')} className={`${inputCls(!!errors.phone)} text-left`} dir="ltr" />
              </FormField>
            </div>

            <FormField label={t('profile.maritalStatus')} required>
              <div className="flex gap-3">
                {(['single', 'married'] as const).map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setValue('maritalStatus', s)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      maritalStatus === s ? 'bg-qwaam-pink text-white border-qwaam-pink' : 'bg-gray-50 text-text-muted border-border-light'
                    }`}
                  >
                    {t(`profile.${s}`)}
                  </button>
                ))}
              </div>
            </FormField>

            {isMarried && (
              <div className="grid grid-cols-1 gap-3">
                {['isPregnant', 'isNursing', 'hasChildren'].map(k => (
                  <CheckboxItem
                    key={k} id={k} label={t(`profile.${k}`)}
                    checked={!!watch(k as any)}
                    onChange={c => setValue(k as any, c)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ====== Health ====== */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-qwaam-pink border-b border-border-light pb-2">{t('profile.health')}</h3>
            
            <FormField label={t('onboarding.step3.injuriesQuestion')} error={(errors as any).hasInjuries?.message}>
              <BooleanToggle
                value={watch('hasInjuries') || false}
                onChange={v => setValue('hasInjuries', v)}
                yesLabel={t('profile.yes')}
                noLabel={t('profile.no')}
              />
            </FormField>
            {hasInjuries && (
              <FormField label={t('profile.injuryDetails')}>
                <input type="text" {...register('injuryDetails')} className={inputCls()} />
              </FormField>
            )}

            <FormField label={t('onboarding.step3.chronicDiseasesQuestion')} error={(errors as any).hasChronicDiseases?.message}>
              <BooleanToggle
                value={watch('hasChronicDiseases') || false}
                onChange={v => setValue('hasChronicDiseases', v)}
                yesLabel={t('profile.yes')}
                noLabel={t('profile.no')}
              />
            </FormField>
            {hasChronicDiseases && (
              <div className="grid grid-cols-2 gap-3">
                {['diabetes', 'anemia', 'stomachGerms', 'colon', 'stomachUlcers', 'insulinResistance', 'pcos', 'thyroid', 'heart', 'other'].map(k => {
                  const current = watch('chronicDiseases') || [];
                  return (
                    <CheckboxItem
                      key={k} id={k} label={t(`onboarding.step3.chronicOptions.${k}`)}
                      checked={current.includes(k)}
                      onChange={(c) => {
                        setValue('chronicDiseases', c ? [...current, k] : current.filter(x => x !== k));
                      }}
                    />
                  );
                })}
              </div>
            )}

            <FormField label={t('onboarding.step3.smokerQuestion')} error={(errors as any).isSmoker?.message}>
              <BooleanToggle
                value={watch('isSmoker') || false}
                onChange={v => setValue('isSmoker', v)}
                yesLabel={t('profile.yes')}
                noLabel={t('profile.no')}
              />
            </FormField>
          </section>

          {/* ====== Goals ====== */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-qwaam-pink border-b border-border-light pb-2">{t('profile.goals')}</h3>
            <FormField label={t('profile.goal')} required>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GOALS.map(g => {
                  const pg = watch('primaryGoal');
                  return (
                    <button
                      key={g} type="button"
                      onClick={() => setValue('primaryGoal', g)}
                      className={`p-3 rounded-xl font-bold text-sm border-2 transition-all text-center ${
                        pg === g ? 'bg-qwaam-pink text-white border-qwaam-pink' : 'bg-gray-50 text-text-muted border-border-light'
                      }`}
                    >
                      {t(`profile.${g}`)}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <FormField label={t('profile.workoutDays')} error={errors.workoutDaysPerWeek?.message} required>
              <input type="number" {...register('workoutDaysPerWeek', { valueAsNumber: true })} min={1} max={7} className={inputCls(!!errors.workoutDaysPerWeek)} />
            </FormField>

            <FormField label={t('profile.experience')}>
              <textarea {...register('sportsExperience')} rows={2} className={`${inputCls()} resize-none`} />
            </FormField>

            <FormField label={t('profile.supplements')} error={errors.currentSupplements?.message}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['whey', 'creatine', 'preWorkout', 'vitamins', 'none'].map((k) => {
                  const currSupps = watch('currentSupplements') || [];
                  return (
                    <CheckboxItem
                      key={k} id={`supp_${k}`} label={t(`onboarding.step4.supplementsList.${k}`)}
                      checked={currSupps.includes(k)}
                      onChange={(checked) => {
                        if (k === 'none') {
                          setValue('currentSupplements', checked ? ['none'] : []);
                        } else {
                          let next = checked ? [...currSupps, k] : currSupps.filter(x => x !== k);
                          if (next.includes('none')) next = next.filter(x => x !== 'none');
                          setValue('currentSupplements', next);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </FormField>
          </section>

          {/* ====== Body & Media ====== */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-qwaam-pink border-b border-border-light pb-2">{t('profile.body')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('profile.weight')} error={errors.weight?.message} required>
                <input type="number" {...register('weight', { valueAsNumber: true })} min={20} max={300} className={inputCls(!!errors.weight)} />
              </FormField>
              <FormField label={t('profile.height')} error={errors.height?.message} required>
                <input type="number" {...register('height', { valueAsNumber: true })} min={100} max={250} className={inputCls(!!errors.height)} />
              </FormField>
            </div>

            <FormField label={t('profile.bodyDesc')} error={errors.bodyDescription?.message} required>
              <textarea {...register('bodyDescription')} rows={3} className={`${inputCls(!!errors.bodyDescription)} resize-none`} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FileUploadBox name="inbodyFile" label={t('profile.inbody')} currentUrl={currentInbody} />
              <FileUploadBox name="bodyPhotoFile" label={t('profile.bodyPhoto')} currentUrl={currentPhoto} />
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-bold text-text-main mb-3">{t('profile.measurements')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MEASUREMENT_KEYS.map((k) => (
                  <FormField key={k} label={`${t(`profile.${k}`)} (${t('profile.cm')})`}>
                    <input type="number" {...register(`measurements.${k}`, { valueAsNumber: true })} className={inputCls()} />
                  </FormField>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ====== Actions ====== */}
        <div className="flex gap-4">
          <button type="button" onClick={() => router.push('/client/profile')} className="flex-1 py-4 rounded-xl border-2 border-border-light font-bold text-text-muted focus:opacity-80">
            {t('profile.cancel')}
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-2 py-4 rounded-xl bg-qwaam-pink text-white font-bold disabled:opacity-60 flex items-center justify-center w-full">
            {isSubmitting ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </div>

      </form>
    </FormProvider>
  );
}
