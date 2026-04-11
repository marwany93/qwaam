// src/components/onboarding/OnboardingWizard.tsx
// Master wizard component. Owns the react-hook-form context, step navigation,
// email async validation, Firebase account creation, and file upload transaction.
// Resolver strategy: fullOnboardingSchema runs on the whole form; goNext() calls
// trigger([...stepFields]) to scope validation to only the current step's fields.
'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { checkEmailExists } from '@/actions/onboarding-actions';
import { fullOnboardingSchema, type FullOnboardingData } from '@/lib/onboarding-schema';
import { setTraineeCustomClaim } from '@/actions/onboarding-actions';
import { submitOnboarding } from '@/actions/client-actions';

// Fields belonging to each step — used to scope trigger() calls
const STEP_FIELDS: (keyof FullOnboardingData)[][] = [
  ['email'],
  ['name', 'dateOfBirth', 'phone', 'maritalStatus'],
  ['hasInjuries', 'hasChronicDiseases', 'isSmoker'],
  ['primaryGoal', 'workoutDaysPerWeek', 'currentSupplements'],
  ['weight', 'height', 'bodyDescription', 'inbodyFile'],
  ['password'],
];
import { Link } from '@/i18n/navigation';

// Step sub-components
import StepEmail from './StepEmail';
import StepPersonal from './StepPersonal';
import StepHealth from './StepHealth';
import StepGoals from './StepGoals';
import StepBody from './StepBody';
import StepAccount from './StepAccount';

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;

const STEP_ICONS = ['✉️', '👤', '🩺', '🎯', '📏', '🔐'];

const slideVariants = {
  initial: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function uploadFile(
  file: File,
  uid: string,
  name: string
): Promise<string> {
  const storageRef = ref(storage, `trainee_uploads/${uid}/${name}_${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const methods = useForm<FullOnboardingData>({
    resolver: zodResolver(fullOnboardingSchema as any),
    defaultValues: {
      email: '',
      maritalStatus: 'single',
      hasInjuries: false,
      hasChronicDiseases: false,
      isSmoker: false,
      workoutDaysPerWeek: 3,
      currentSupplements: [],
      chronicDiseases: [],
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, getValues, setError } = methods;

  // ── Scroll to top on step change ─────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // ── Step navigation ────────────────────────────────────────────────────────
  async function goNext() {
    // Only validate the fields that belong to the current step
    const isValid = await trigger(STEP_FIELDS[currentStep] as any);
    if (!isValid) return;

    // Step 1 special: async email existence check
    if (currentStep === 0) {
      setIsCheckingEmail(true);
      try {
        const { exists } = await checkEmailExists(getValues('email'));
        if (exists) {
          setError('email', {
            type: 'manual',
            message: t('step1.emailExists'),
          });
          return;
        }
      } finally {
        setIsCheckingEmail(false);
      }
    }

    // Step 4 (body): manually validate inbodyFile presence since FileList can't go through Zod
    if (currentStep === 4) {
      const files = getValues('inbodyFile');
      if (!files || files.length === 0) {
        setError('inbodyFile' as any, {
          type: 'manual',
          message: t('errors.inbodyRequired'),
        });
        return;
      }
    }

    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  // ── Final submit: Firebase transactional flow ──────────────────────────────
  async function onFinalSubmit(data: FullOnboardingData) {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1. Create Auth user
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const uid = credential.user.uid;

      // Update display name immediately
      await updateProfile(credential.user, { displayName: data.name });

      // 🚨 2. إضافة الـ Custom Claim (ختم المتدربة) عن طريق السيرفر
      // ⚠️ متنساش تضيف سطر الـ import ده في أول الملف فوق خالص:
      // import { setTraineeCustomClaim } from '@/actions/onboarding-actions';
      await setTraineeCustomClaim(uid);

      // 🚨 3. إجبار المتصفح على سحب Token جديد بالختم الجديد (لاحظ تمرير true)
      const idToken = await credential.user.getIdToken(true);

      // 4. إنشاء الـ Session Cookie بالـ Token المحدث
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // 5. Upload files to Firebase Storage
      let inbodyUrl = '';
      let bodyPhotoUrl = '';

      if (data.inbodyFile?.[0]) {
        inbodyUrl = await uploadFile(data.inbodyFile[0], uid, 'inbody');
      }
      if (data.bodyPhotoFile?.[0]) {
        bodyPhotoUrl = await uploadFile(data.bodyPhotoFile[0], uid, 'body_photo');
      }

      // 6. Write complete document via Server Action
      const docPayload = sanitizeForFirestore({
        role: 'trainee',
        name: data.name,
        email: data.email,
        onboarding: {
          // Step 2
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          maritalStatus: data.maritalStatus,
          isPregnant: data.isPregnant ?? false,
          isNursing: data.isNursing ?? false,
          hasChildren: data.hasChildren ?? false,
          // Step 3
          hasInjuries: data.hasInjuries,
          injuryDetails: data.injuryDetails ?? '',
          hasChronicDiseases: data.hasChronicDiseases,
          chronicDiseases: data.chronicDiseases ?? [],
          isSmoker: data.isSmoker,
          // Step 4
          primaryGoal: data.primaryGoal,
          workoutDaysPerWeek: data.workoutDaysPerWeek,
          sportsExperience: data.sportsExperience ?? '',
          currentSupplements: data.currentSupplements,
          // Step 5
          weight: data.weight,
          height: data.height,
          bodyDescription: data.bodyDescription,
          inbodyUrl,
          bodyPhotoUrl,
          measurements: data.measurements ?? {},
        },
        traineeData: {
          assignedCoachUid: null,   // Assigned later by coach
          unreadCount: 0,
          assignedWorkouts: [],
          assignedMeals: [],
          progress: {},
        },
      });

      const res = await submitOnboarding(uid, docPayload);

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit onboarding');
      }

      setIsSuccess(true);

      // Redirect to client portal after brief success state using next-intl router
      setTimeout(() => {
        router.push('/client');
      }, 2000);

    } catch (err: any) {
      console.error('[Onboarding] Final submit error:', err);
      // Ensure we stop the loader explicitly so the UI doesn't hang
      setIsSubmitting(false);
      setSubmitError(t('errors.accountCreationFailed'));
    } 
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const STEP_NAMES = [
    t('steps.email'),
    t('steps.personal'),
    t('steps.health'),
    t('steps.goals'),
    t('steps.body'),
    t('steps.account'),
  ];

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl shadow-lg">
          🎉
        </div>
        <h2 className="text-2xl font-black text-text-main">{t('step6.successMessage')}</h2>
        <div className="w-8 h-8 rounded-full border-4 border-qwaam-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="bg-white rounded-3xl shadow-2xl shadow-qwaam-pink/5 border border-border-light overflow-hidden max-w-xl w-full mx-auto">

        {/* ── Progress Header ── */}
        <div className="bg-gradient-to-br from-qwaam-pink to-pink-600 p-6 pb-8 text-white relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute -top-8 -end-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -start-4 w-20 h-20 bg-white/10 rounded-full" />

          {/* Brand + Step label */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity">
              <span className="font-black text-xl tracking-tight">قوام</span>
            </Link>
            <span className="text-pink-100 text-sm font-bold">
              {t('nav.step')} {currentStep + 1} / {TOTAL_STEPS}
            </span>
          </div>

          {/* Step title */}
          <div className="relative z-10 mb-5">
            <div className="text-2xl mb-1">{STEP_ICONS[currentStep]}</div>
            <h1 className="text-xl font-black">{STEP_NAMES[currentStep]}</h1>
          </div>

          {/* Progress bar */}
          <div className="relative z-10 bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={false}
              animate={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>

          {/* Step dots */}
          <div className="flex gap-2 mt-3 relative z-10">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-white flex-1' : 'bg-white/30 w-4'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* ── Step Content ── */}
        <div className="p-6 md:p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {currentStep === 0 && <StepEmail isChecking={isCheckingEmail} />}
              {currentStep === 1 && <StepPersonal />}
              {currentStep === 2 && <StepHealth />}
              {currentStep === 3 && <StepGoals />}
              {currentStep === 4 && <StepBody />}
              {currentStep === 5 && <StepAccount />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Error Banner ── */}
        {submitError && (
          <div className="mx-6 mb-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 animate-in zoom-in duration-200">
            <span>⚠️</span>
            {submitError}
          </div>
        )}

        {/* ── Navigation Footer ── */}
        <div className="px-6 pb-6 md:px-8 md:pb-8 flex gap-3">
          {/* Back button */}
          {currentStep > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl border-2 border-border-light font-bold text-text-muted hover:border-qwaam-pink/50 hover:text-qwaam-pink transition-all text-sm disabled:opacity-50"
            >
              ← {t('nav.back')}
            </button>
          )}

          {/* Next / Submit button */}
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit(onFinalSubmit)}
              disabled={isSubmitting}
              className="flex-2 flex-1 py-3.5 rounded-xl bg-qwaam-pink text-white font-bold shadow-lg shadow-qwaam-pink/25 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {t('step6.submitting')}
                </span>
              ) : (
                t('step6.submitBtn')
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={isCheckingEmail}
              className="flex-1 py-3.5 rounded-xl bg-qwaam-pink text-white font-bold shadow-lg shadow-qwaam-pink/25 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {isCheckingEmail ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {t('step1.checkingEmail')}
                </span>
              ) : (
                `${t('nav.next')} →`
              )}
            </button>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
