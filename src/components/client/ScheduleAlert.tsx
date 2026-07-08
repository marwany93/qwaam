'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';

interface Props {
  /** Preformatted (Asia/Riyadh) end date. */
  endDate: string;
  /** now >= scheduleEndsAt */
  ended: boolean;
}

/**
 * Date-based top-of-dashboard alert for month-based (duration-model) Schedule
 * plans. The parent only mounts it when the subscription is ending within 7
 * days (reminder) or has already ended. Purely informational — the
 * RenewalWizard in the ScheduleStatusCard below is the only renewal entry point.
 */
export default function ScheduleAlert({ endDate, ended }: Props) {
  const t = useTranslations('schedule');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const variant = ended
    ? {
        wrapper: 'from-rose-50 via-rose-50/80 to-pink-50 border-rose-200',
        iconBg: 'bg-rose-100 text-rose-600',
        textPrimary: 'text-rose-900',
        textSecondary: 'text-rose-800/80',
        Icon: ExclamationTriangleIcon,
        dismissHover: 'hover:bg-rose-100 hover:text-rose-700',
        eyebrow: t('endedTitle'),
        message: t('ended', { endDate }),
      }
    : {
        wrapper: 'from-amber-50 via-yellow-50/80 to-amber-50 border-amber-200',
        iconBg: 'bg-amber-100 text-amber-700',
        textPrimary: 'text-amber-900',
        textSecondary: 'text-amber-800/80',
        Icon: ClockIcon,
        dismissHover: 'hover:bg-amber-100 hover:text-amber-700',
        eyebrow: t('aboutToEndTitle'),
        message: t('reminder', { endDate }),
      };

  const Icon = variant.Icon;

  return (
    <AnimatePresence>
      <motion.section
        key="schedule-alert"
        dir="rtl"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative overflow-hidden bg-gradient-to-l ${variant.wrapper} border-2 rounded-2xl shadow-sm`}
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق التنبيه"
          className={`absolute top-3 left-3 p-1.5 rounded-full text-text-muted transition-colors ${variant.dismissHover}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>

        <div className="px-6 sm:px-10 py-7 sm:py-8 flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${variant.iconBg}`}>
            <Icon className="w-7 h-7" />
          </div>

          <p className={`text-xs font-black uppercase tracking-widest ${variant.textSecondary}`}>
            {variant.eyebrow}
          </p>

          <p className={`max-w-xl text-sm sm:text-base font-bold leading-relaxed ${variant.textPrimary}`}>
            {variant.message}
          </p>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
