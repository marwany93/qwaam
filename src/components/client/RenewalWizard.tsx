'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getPlans, type Plan, type PlanLocation, type PlanType } from '@/lib/pricing-config';
import PhotoUpload from '@/components/client/PhotoUpload';
import { createRenewalRequest } from '@/actions/client-actions';
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

type Step = 1 | 2 | 3 | 4;

interface Props {
  uid: string;
}

const INSTAPAY_NUMBER = '01001280161';
const VODAFONE_CASH_NUMBER = '01001280161';

export default function RenewalWizard({ uid }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState<PlanLocation>('home');
  const [planType, setPlanType] = useState<PlanType>('live');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isPending, startTx] = useTransition();
  const [submitError, setSubmitError] = useState('');

  const plans = getPlans(location, planType);

  const handleSubmit = () => {
    if (!selectedPlan || !proofUrl) return;
    setSubmitError('');
    startTx(async () => {
      const res = await createRenewalRequest(selectedPlan.id, proofUrl);
      if (res.success) {
        setStep(4);
        router.refresh();
      } else {
        setSubmitError(res.message);
      }
    });
  };

  const reset = () => {
    setOpen(false);
    setStep(1);
    setSelectedPlan(null);
    setProofUrl('');
    setUploadError('');
    setSubmitError('');
  };

  if (!open) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 shadow-md shadow-qwaam-pink/20 transition-all active:scale-[0.98]"
        >
          <ShoppingCartIcon className="w-5 h-5" />
          اشتري حصصاً إضافية
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-gray-50 border border-border-light rounded-2xl overflow-hidden" dir="rtl">

      {/* Step indicator bar */}
      <div className="grid grid-cols-3 border-b border-border-light text-[11px] font-black">
        {(['اختاري الباقة', 'تفاصيل الدفع', 'إيصال التحويل'] as const).map((label, i) => {
          const s = (i + 1) as Step;
          const isActive = step === s;
          const isDone = step > s;
          return (
            <div
              key={s}
              className={`py-2.5 text-center transition-colors ${
                isActive
                  ? 'bg-qwaam-pink text-white'
                  : isDone
                  ? 'bg-green-50 text-green-700'
                  : 'text-text-muted bg-white'
              }`}
            >
              {isDone ? '✓ ' : ''}{label}
            </div>
          );
        })}
      </div>

      <div className="p-4 space-y-4">

        {/* ── Step 1: Plan selection ─────────────────────────── */}
        {step === 1 && (
          <>
            {/* Location toggle */}
            <div className="flex gap-2">
              {(['home', 'gym'] as PlanLocation[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => { setLocation(loc); setSelectedPlan(null); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
                    location === loc ? 'bg-qwaam-pink text-white shadow-sm' : 'bg-white border border-border-light text-text-muted'
                  }`}
                >
                  {loc === 'home' ? '🏠 منزلي' : '🏋️ جيم'}
                </button>
              ))}
            </div>

            {/* Type toggle */}
            <div className="flex gap-2">
              {(['live', 'schedule'] as PlanType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setPlanType(t); setSelectedPlan(null); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
                    planType === t ? 'bg-qwaam-pink text-white shadow-sm' : 'bg-white border border-border-light text-text-muted'
                  }`}
                >
                  {t === 'live' ? '📹 لايف' : '📅 جدول'}
                </button>
              ))}
            </div>

            {/* Plan cards grid — 1 col on mobile, 2 cols on sm+.
                Odd last card is centered at half-width so rows stay balanced. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plans.map((plan, idx) => {
                const isLastOdd = plans.length % 2 !== 0 && idx === plans.length - 1;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3 rounded-xl border-2 text-right transition-all
                      ${isLastOdd ? 'sm:col-span-2 sm:w-1/2 sm:mx-auto' : ''}
                      ${selectedPlan?.id === plan.id
                        ? 'border-qwaam-pink bg-qwaam-pink-light'
                        : 'border-border-light bg-white hover:border-qwaam-pink/50'
                      }`}
                  >
                    {plan.popular && (
                      <span className="inline-block text-[9px] font-black bg-qwaam-yellow px-1.5 py-0.5 rounded-full text-text-main mb-1">
                        الأشهر
                      </span>
                    )}
                    <p className="font-black text-text-main text-sm leading-tight">
                      {plan.sessions ? `${plan.sessions} حصة` : `${plan.days} أيام/أسبوع`}
                    </p>
                    <p className="font-black text-qwaam-pink text-base mt-0.5" dir="ltr">{plan.price} EGP</p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-3 rounded-xl font-black text-text-muted bg-white border border-border-light hover:bg-gray-100 transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!selectedPlan}
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                التالي <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Payment info ───────────────────────────── */}
        {step === 2 && selectedPlan && (
          <>
            {/* Selected plan summary */}
            <div className="bg-qwaam-pink-light border border-qwaam-pink/20 rounded-xl p-4 space-y-1">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">الباقة المختارة</p>
              <p className="font-black text-text-main">
                {selectedPlan.sessions
                  ? `${selectedPlan.sessions} حصة لايف`
                  : `${selectedPlan.days} أيام/أسبوع (جدول)`}
                {' · '}{location === 'home' ? 'منزلي' : 'جيم'}
              </p>
              <p className="text-2xl font-black text-qwaam-pink" dir="ltr">{selectedPlan.price} EGP</p>
            </div>

            {/* Transfer instructions */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-text-main leading-relaxed">
                حوّلي المبلغ عبر أي من الطرق التالية:
              </p>

              {/* InstaPay */}
              <div className="bg-white border border-border-light rounded-xl p-3 space-y-1">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">InstaPay</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black text-qwaam-pink tracking-widest select-all" dir="ltr">
                    {INSTAPAY_NUMBER}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted leading-tight text-left">
                    اضغطي مطوّلاً للنسخ
                  </span>
                </div>
              </div>

              {/* Vodafone Cash */}
              <div className="bg-white border border-border-light rounded-xl p-3 space-y-1">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Vodafone Cash</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black text-qwaam-pink tracking-widest select-all" dir="ltr">
                    {VODAFONE_CASH_NUMBER}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted leading-tight text-left">
                    اضغطي مطوّلاً للنسخ
                  </span>
                </div>
              </div>

              <p className="text-xs font-bold text-text-muted">
                بعد إتمام التحويل، اضغطي &quot;التالي&quot; لرفع صورة الإيصال.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-3 rounded-xl font-black text-text-muted bg-white border border-border-light hover:bg-gray-100 transition-all"
              >
                <ChevronRightIcon className="w-4 h-4" /> رجوع
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 transition-all"
              >
                التالي <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Upload proof ───────────────────────────── */}
        {step === 3 && (
          <>
            <p className="text-sm font-bold text-text-main leading-relaxed">
              ارفعي صورة إيصال التحويل لتسريع التفعيل:
            </p>

            <div className="max-w-[180px] mx-auto">
              <PhotoUpload
                uid={uid}
                pathPrefix={`payment_proofs/${uid}`}
                label="صورة الإيصال"
                currentUrl={proofUrl || undefined}
                disabled={isPending}
                onUploaded={(url) => { setProofUrl(url); setUploadError(''); }}
                onError={setUploadError}
                onUploadingChange={(u) => setUploading(u)}
              />
            </div>

            {uploadError && (
              <p className="text-xs font-bold text-red-500 text-center">{uploadError}</p>
            )}
            {submitError && (
              <p className="text-xs font-bold text-red-500 text-center">{submitError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isPending}
                className="flex items-center gap-1 px-4 py-3 rounded-xl font-black text-text-muted bg-white border border-border-light hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <ChevronRightIcon className="w-4 h-4" /> رجوع
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!proofUrl || uploading || isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال الطلب'
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Success ────────────────────────────────── */}
        {step === 4 && (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-9 h-9 text-green-500" />
            </div>
            <p className="font-black text-text-main text-lg">تم إرسال طلبك بنجاح!</p>
            <p className="text-sm font-bold text-text-muted max-w-xs mx-auto leading-relaxed">
              سيتواصل معك المدرب قريباً لتفعيل باقتك الجديدة.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
