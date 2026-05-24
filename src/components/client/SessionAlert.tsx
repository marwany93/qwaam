'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { requestRenewal } from '@/actions/client-actions';
import {
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

interface Props {
  sessionsRemaining: number;
  /** Pre-populated when the trainee already has a pending renewal request. */
  alreadyRequested?: boolean;
}

/**
 * Top-of-dashboard alert that warns the trainee when their session balance
 * is low or depleted. Dismissible (local state only — re-appears on next
 * page load so the trainee can't permanently silence it).
 *
 * Two variants:
 *   - WARNING  (1–2 sessions left): gold gradient, encouraging copy
 *   - EXPIRED  (0 sessions):        rose gradient, supportive copy +
 *                                   pulse-animated CTA
 *
 * Returns null when sessionsRemaining > 2 — no visual noise during normal use.
 */
export default function SessionAlert({ sessionsRemaining, alreadyRequested }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [requested, setRequested] = useState(!!alreadyRequested);
  const [feedback, setFeedback] = useState('');
  const [isPending, startTx] = useTransition();

  if (sessionsRemaining > 2) return null;
  if (dismissed) return null;

  const isExpired = sessionsRemaining <= 0;

  // ── Variant config ───────────────────────────────────────
  const variant = isExpired
    ? {
        wrapper: 'from-rose-50 via-rose-50/80 to-pink-50 border-rose-200',
        iconBg: 'bg-rose-100 text-rose-600',
        textPrimary: 'text-rose-900',
        textSecondary: 'text-rose-800/80',
        Icon: ExclamationTriangleIcon,
        button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30 animate-pulse',
        dismissHover: 'hover:bg-rose-100 hover:text-rose-700',
        message:
          'انتهت حصصك الحالية، لكن إنجازاتك باقية! يمكنك تصفح ملفك الشخصي في أي وقت، وللعودة للتدريب يمكنك تجديد الاشتراك.',
      }
    : {
        wrapper: 'from-amber-50 via-yellow-50/80 to-amber-50 border-amber-200',
        iconBg: 'bg-amber-100 text-amber-700',
        textPrimary: 'text-amber-900',
        textSecondary: 'text-amber-800/80',
        Icon: SparklesIcon,
        button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
        dismissHover: 'hover:bg-amber-100 hover:text-amber-700',
        message:
          'رحلتك مستمرة! متبقي لديك حصتين فقط، لا تدعي الحماس يتوقف وجددي اشتراكك الآن.',
      };

  const Icon = variant.Icon;

  // ── Renew handler ────────────────────────────────────────
  const handleRenew = () => {
    startTx(async () => {
      const res = await requestRenewal();
      setFeedback(res.message);
      if (res.success) setRequested(true);
    });
  };

  return (
    <AnimatePresence>
      <motion.section
        key="session-alert"
        dir="rtl"
        // Slide-down entrance: starts above the page, fades + drops into place
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative overflow-hidden bg-gradient-to-l ${variant.wrapper} border-2 rounded-2xl shadow-sm`}
      >
        {/* Dismiss button — absolute so it doesn't disrupt the centered layout */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق التنبيه"
          className={`absolute top-3 left-3 p-1.5 rounded-full text-text-muted transition-colors ${variant.dismissHover}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>

        <div className="px-6 sm:px-10 py-7 sm:py-8 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${variant.iconBg}`}>
            <Icon className="w-7 h-7" />
          </div>

          {/* Headline + count */}
          <div className="space-y-1">
            <p className={`text-xs font-black uppercase tracking-widest ${variant.textSecondary}`}>
              {isExpired ? 'باقتك انتهت' : 'تنبيه بسيط'}
            </p>
            <p className={`text-2xl sm:text-3xl font-black ${variant.textPrimary}`}>
              {isExpired ? '0 حصص متبقية' : `${sessionsRemaining} حصص فقط`}
            </p>
          </div>

          {/* Message */}
          <p className={`max-w-xl text-sm sm:text-base font-bold leading-relaxed ${variant.textPrimary}`}>
            {variant.message}
          </p>

          {/* CTA / state */}
          {requested ? (
            <div className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-black text-sm">
              ✅ {feedback || 'تم إرسال طلب التجديد، سيتواصل معك المدرب قريباً.'}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRenew}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variant.button}`}
              >
                <ArrowPathIcon className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
                {isPending ? 'جاري الإرسال...' : 'جدّدي الاشتراك الآن'}
              </button>
              {feedback && !requested && (
                <p className="text-xs font-bold text-red-600">{feedback}</p>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
