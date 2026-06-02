'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

interface Props {
  sessionsRemaining: number;
}

/**
 * Purely informational top-of-dashboard alert shown when session balance
 * is low (1–2) or depleted (0). Dismissible for the current page session.
 * Does NOT submit any backend action — the RenewalWizard in the session
 * widget is the only entry point for creating renewal requests.
 */
export default function SessionAlert({ sessionsRemaining }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (sessionsRemaining > 2) return null;
  if (dismissed) return null;

  const isExpired = sessionsRemaining <= 0;

  const variant = isExpired
    ? {
        wrapper: 'from-rose-50 via-rose-50/80 to-pink-50 border-rose-200',
        iconBg: 'bg-rose-100 text-rose-600',
        textPrimary: 'text-rose-900',
        textSecondary: 'text-rose-800/80',
        Icon: ExclamationTriangleIcon,
        dismissHover: 'hover:bg-rose-100 hover:text-rose-700',
        message:
          'انتهت حصصك الحالية، لكن إنجازاتك باقية! للعودة للتدريب استخدمي زر التجديد أدناه.',
      }
    : {
        wrapper: 'from-amber-50 via-yellow-50/80 to-amber-50 border-amber-200',
        iconBg: 'bg-amber-100 text-amber-700',
        textPrimary: 'text-amber-900',
        textSecondary: 'text-amber-800/80',
        Icon: SparklesIcon,
        dismissHover: 'hover:bg-amber-100 hover:text-amber-700',
        message:
          'رحلتك مستمرة! متبقي لديك حصتين فقط — جددي اشتراكك من الويدجت أدناه قبل أن تنتهي.',
      };

  const Icon = variant.Icon;

  return (
    <AnimatePresence>
      <motion.section
        key="session-alert"
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

          <div className="space-y-1">
            <p className={`text-xs font-black uppercase tracking-widest ${variant.textSecondary}`}>
              {isExpired ? 'باقتك انتهت' : 'تنبيه بسيط'}
            </p>
            <p className={`text-2xl sm:text-3xl font-black ${variant.textPrimary}`}>
              {isExpired ? '0 حصص متبقية' : `${sessionsRemaining} حصص فقط`}
            </p>
          </div>

          <p className={`max-w-xl text-sm sm:text-base font-bold leading-relaxed ${variant.textPrimary}`}>
            {variant.message}
          </p>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
