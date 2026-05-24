'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { confirmTraineePayment } from '@/actions/admin-actions';
import { PRICING_CONFIG, findPlanById } from '@/lib/pricing-config';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface Props {
  traineeUid: string;
  currentPlanId?: string;
  amountPaid?: string | null;
  paymentScreenshotUrl?: string | null;
}

// Pretty Arabic label for a plan id, e.g. "home-live-12" → "منزلي / لايف · 12 حصة · 780 EGP"
function labelFor(planId: string): string {
  const plan = findPlanById(planId);
  if (!plan) return planId;

  const isHome = planId.startsWith('home');
  const isLive = planId.includes('live');

  const loc = isHome ? 'منزلي' : 'جيم';
  const type = isLive ? 'لايف' : 'جدول';
  const unit = isLive ? `${plan.sessions} حصة` : `${plan.days} أيام/أسبوع`;

  return `${loc} · ${type} · ${unit} · ${plan.price} EGP`;
}

export default function PendingPaymentCard({
  traineeUid,
  currentPlanId,
  amountPaid,
  paymentScreenshotUrl,
}: Props) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // Flatten all plans into one list for the dropdown
  const allPlans = PRICING_CONFIG.flatMap((cat) => cat.plans.map((p) => p.id));

  const planChanged = selectedPlanId && selectedPlanId !== currentPlanId;
  const selectedPlan = selectedPlanId ? findPlanById(selectedPlanId) : null;

  const handleConfirm = () => {
    setError('');
    setSuccess('');

    startTransition(async () => {
      const res = await confirmTraineePayment(
        traineeUid,
        planChanged ? selectedPlanId : undefined,
      );

      if (!res.success) {
        setError(res.error || 'فشل التأكيد.');
        return;
      }

      setSuccess(`تم تفعيل الباقة بنجاح (${res.sessions} حصة).`);
      // Server actions already revalidate the path, but we also refresh the
      // router so the parent Server Component re-renders without the card.
      router.refresh();
    });
  };

  return (
    <section
      dir="rtl"
      className="bg-gradient-to-br from-yellow-50 to-white rounded-3xl border-2 border-qwaam-yellow shadow-sm p-6 space-y-5 relative overflow-hidden"
    >
      {/* Accent stripe */}
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-qwaam-yellow via-yellow-400 to-qwaam-yellow" />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-qwaam-yellow text-text-main flex items-center justify-center shrink-0 shadow-sm">
          <CurrencyDollarIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-black text-text-main">إدارة الاشتراك</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-wider">
              معلّق
            </span>
          </div>
          <p className="text-sm font-bold text-text-muted mt-1">
            المتدرّب أتمّ التسجيل وفي انتظار تأكيد التحويل لتفعيل الباقة.
          </p>
        </div>
      </div>

      {/* Current plan summary */}
      <div className="bg-white border border-border-light rounded-2xl p-4 space-y-1">
        <p className="text-xs font-black text-text-muted uppercase tracking-wider">الباقة الحالية</p>
        <p className="font-black text-text-main text-base">
          {currentPlanId ? labelFor(currentPlanId) : 'لا توجد باقة محددة'}
        </p>
        {amountPaid && (
          <p className="text-xs font-bold text-text-muted">
            المبلغ المُسجَّل: <span dir="ltr">{amountPaid} EGP</span>
          </p>
        )}
      </div>

      {/* Proof of payment — thumbnail opens full-size in a new tab */}
      {paymentScreenshotUrl ? (
        <div className="bg-white border border-border-light rounded-2xl p-4 flex items-center gap-4">
          <a
            href={paymentScreenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="فتح صورة كاملة في تبويب جديد"
            className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden border-2 border-border-light hover:border-qwaam-pink transition-colors shrink-0 block"
          >
            {/* External URL from Firebase Storage; plain <img> avoids next/image domain config */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentScreenshotUrl}
              alt="إيصال الدفع"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </a>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-text-muted uppercase tracking-wider mb-1">
              إيصال الدفع
            </p>
            <p className="font-black text-text-main text-sm mb-2">
              تم رفع الصورة من المتدرّبة
            </p>
            <a
              href={paymentScreenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-qwaam-pink hover:text-pink-600 transition-colors"
            >
              <PhotoIcon className="w-4 h-4" />
              عرض الصورة الكاملة
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-border-light rounded-2xl p-4 flex items-center gap-3 text-text-muted">
          <PhotoIcon className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">لم ترفع المتدرّبة صورة إيصال الدفع بعد.</p>
        </div>
      )}

      {/* Plan change dropdown */}
      <div>
        <label className="block text-xs font-black text-text-muted mb-1.5 uppercase tracking-wider">
          تغيير الباقة (اختياري)
        </label>
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold bg-white transition-colors"
        >
          {!currentPlanId && <option value="">— اختر باقة —</option>}
          {allPlans.map((id) => (
            <option key={id} value={id}>
              {labelFor(id)}
            </option>
          ))}
        </select>

        {planChanged && selectedPlan && (
          <p className="text-xs font-bold text-qwaam-pink mt-2">
            ✏️ سيتم تحديث الباقة إلى <span dir="ltr">{selectedPlan.price} EGP</span> عند التأكيد.
          </p>
        )}
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-bold flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-bold flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Confirm CTA */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending || !selectedPlanId}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-qwaam-pink text-white font-black text-base shadow-lg shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            جاري التفعيل...
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            تأكيد الدفع وتفعيل الحساب
          </>
        )}
      </button>
    </section>
  );
}
