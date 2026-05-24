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
import { findPlanById, getMaxDaysFromPlan } from '@/lib/pricing-config';

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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface InitialSubscription {
  planId: string;
  totalPrice: string;
  hasDiet: boolean;
  email?: string;
  phone?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingWizard({ initialSubscription }: { initialSubscription?: InitialSubscription }) {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Derive plan constraints from subscription
  const maxWorkoutDays = initialSubscription?.planId
    ? getMaxDaysFromPlan(initialSubscription.planId)
    : 7;
  const resolvedPlan = initialSubscription?.planId
    ? findPlanById(initialSubscription.planId)
    : undefined;

  const methods = useForm<FullOnboardingData>({
    resolver: zodResolver(fullOnboardingSchema as any),
    defaultValues: {
      email: initialSubscription?.email || '',
      phone: initialSubscription?.phone || '',
      maritalStatus: 'single',
      hasInjuries: false,
      hasChronicDiseases: false,
      isSmoker: false,
      workoutDaysPerWeek: initialSubscription?.planId?.includes('sched') ? maxWorkoutDays : 3,
      currentSupplements: [],
      chronicDiseases: [],
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, getValues, setError, watch, reset } = methods;
  const [showRestoredDraft, setShowRestoredDraft] = useState(false);

  // ── Draft Persistence (Auto-save / Hydrate) ──────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const draft = localStorage.getItem('qwaam_onboarding_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        reset({ ...getValues(), ...parsed });
        setShowRestoredDraft(true);
        setTimeout(() => setShowRestoredDraft(false), 5000);
      }
    } catch (e) {
      console.error('Failed to parse onboarding draft:', e);
      localStorage.removeItem('qwaam_onboarding_draft'); // Clear corrupted storage
    }
  }, [reset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const subscription = watch((value) => {
      try {
        const draftToSave = { ...value };
        // Strip out non-serializable File objects
        delete draftToSave.inbodyFile;
        delete draftToSave.bodyPhotoFile;
        localStorage.setItem('qwaam_onboarding_draft', JSON.stringify(draftToSave));
      } catch (e) {
        console.error('Failed to save onboarding draft:', e);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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
      // تم إيقاف الفحص الإجباري لملف الـ InBody ليكون (اختياري)
      /*
      const files = getValues('inbodyFile');
      if (!files || files.length === 0) {
        setError('inbodyFile' as any, {
          type: 'manual',
          message: t('errors.inbodyRequired'),
        });
        return;
      }
      */
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

      // 6. Write complete document via Server Action.
      // Derive the initial session count from the chosen plan:
      //   - Live plans use `sessions` (e.g., home-live-12 → 12)
      //   - Schedule plans use `days` per week as a sensible starting count
      // The server treats `planSessions` as a hint and re-derives if missing.
      const planSessions = resolvedPlan?.sessions ?? resolvedPlan?.days ?? 0;

      const docPayload = sanitizeForFirestore({
        role: 'trainee',
        name: data.name,
        email: data.email,
        planSessions,
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
          // Subscription info from pricing page
          subscription: initialSubscription ? {
            planId: initialSubscription.planId,
            amountPaid: initialSubscription.totalPrice,
            dietAdded: initialSubscription.hasDiet,
            status: 'pending_payment',
            createdAt: new Date().toISOString(),
          } : null,
        },
      });

      const res = await submitOnboarding(uid, docPayload);

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit onboarding');
      }

      setIsSuccess(true);
      if (typeof window !== 'undefined') localStorage.removeItem('qwaam_onboarding_draft');

      // No auto-redirect anymore — the trainee needs to see the payment
      // instructions and take action (transfer via InstaPay/wallet). They'll
      // click the CTA to enter /client themselves.

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
      <div
        dir="rtl"
        className="bg-white rounded-3xl shadow-2xl shadow-qwaam-pink/10 border border-border-light overflow-hidden max-w-xl w-full mx-auto animate-in fade-in zoom-in duration-500"
      >
        {/* Celebration header */}
        <div className="bg-gradient-to-br from-qwaam-pink to-pink-500 text-white px-8 py-10 text-center">
          <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-5xl shadow-xl mb-4">
            🎉
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
            شكراً لتسجيلك في قوام!
          </h2>
          <p className="font-bold opacity-90 text-sm leading-relaxed">
            لإتمام تفعيل حسابك، يرجى تحويل مبلغ الباقة عبر إحدى الطرق التالية.
          </p>
        </div>

        {/* Payment instructions */}
        <div className="px-6 sm:px-8 py-6 space-y-5">

          {/* Amount summary (if we know the plan) */}
          {initialSubscription && (
            <div className="bg-qwaam-pink-light/40 border border-qwaam-pink/20 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
              <span className="text-xs font-black text-text-muted uppercase tracking-wider">المبلغ المطلوب</span>
              <span className="text-2xl font-black text-qwaam-pink" dir="ltr">
                {initialSubscription.totalPrice} <span className="text-xs font-bold">EGP</span>
              </span>
            </div>
          )}

          {/* Payment methods */}
          <div className="bg-gray-50 border border-border-light rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💸</span>
              <h3 className="font-black text-text-main text-base">طرق الدفع المتاحة</h3>
            </div>

            <ul className="space-y-2 text-sm font-bold text-text-main">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-qwaam-pink" />
                InstaPay
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-qwaam-pink" />
                أي محفظة إلكترونية (Vodafone Cash / Etisalat Cash / Orange Cash)
              </li>
            </ul>

            {/* Phone number — large, copyable, LTR */}
            <div className="bg-white border-2 border-dashed border-qwaam-pink rounded-xl p-4 text-center">
              <p className="text-xs font-black text-text-muted uppercase tracking-wider mb-1">
                رقم التحويل
              </p>
              <p className="text-2xl font-black text-qwaam-pink tracking-wide select-all" dir="ltr">
                01001280161
              </p>
              <p className="text-[11px] font-bold text-text-muted mt-2">
                اضغطي مطوّلاً على الرقم لنسخه
              </p>
            </div>
          </div>

          {/* Next-step note */}
          <p className="text-xs font-bold text-text-muted leading-relaxed text-center px-2">
            بعد إتمام التحويل، سيقوم المدرّب بمراجعة الدفع وتفعيل باقتك خلال وقت قصير. ستتمكنين من تصفح حسابك الآن، وسيتم تفعيل المحتوى تلقائياً.
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={() => router.push('/client')}
            className="w-full py-4 rounded-2xl bg-qwaam-pink text-white font-black text-base shadow-lg shadow-qwaam-pink/30 hover:bg-pink-600 active:scale-[0.99] transition-all"
          >
            انتقل إلى حسابي ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="bg-white rounded-3xl shadow-2xl shadow-qwaam-pink/5 border border-border-light overflow-hidden max-w-xl w-full mx-auto relative">

        {/* ── Subscription Summary ── */}
        {initialSubscription && resolvedPlan && (
          <div className="bg-gradient-to-r from-qwaam-pink-light to-qwaam-yellow/10 border-b border-qwaam-pink/10 px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <div>
                <p className="text-xs font-bold text-text-muted">{t('subscriptionBanner') || 'الباقة المختارة'}</p>
                <p className="text-sm font-black text-qwaam-pink">
                  {initialSubscription.planId.includes('live')
                    ? `${resolvedPlan.sessions} ${t('bannerSessions') || 'حصة لايف'}`
                    : `${resolvedPlan.days} ${t('bannerDays') || 'أيام / أسبوع'}`
                  }
                  {initialSubscription.hasDiet && ` + ${t('bannerDiet') || 'نظام غذائي'}`}
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-text-main whitespace-nowrap">
              {initialSubscription.totalPrice} {t('bannerCurrency') || 'ج.م'}
            </span>
          </div>
        )}

        {/* ── Draft Restored Banner ── */}
        <AnimatePresence>
          {showRestoredDraft && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-green-50 border-b border-green-100 text-green-700 text-xs font-bold px-6 py-2 text-center"
            >
              ✨ تم استعادة بياناتك السابقة
            </motion.div>
          )}
        </AnimatePresence>

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
              {currentStep === 0 && <StepEmail isChecking={isCheckingEmail} isLocked={!!initialSubscription?.email} />}
              {currentStep === 1 && <StepPersonal isLocked={!!initialSubscription?.phone} />}
              {currentStep === 2 && <StepHealth />}
              {currentStep === 3 && <StepGoals maxWorkoutDays={maxWorkoutDays} />}
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
