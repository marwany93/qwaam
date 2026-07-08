'use client';

import { useTranslations } from 'next-intl';
import RenewalWizard from './RenewalWizard';

interface Props {
  uid: string;
  /** No schedule uploaded yet — coach hasn't anchored the month. */
  awaiting: boolean;
  /** now >= scheduleEndsAt */
  ended: boolean;
  /** 0 < (scheduleEndsAt - now) <= 7 days */
  aboutToEnd: boolean;
  /** Preformatted (Asia/Riyadh) start date, or null while awaiting. */
  startDate: string | null;
  /** Preformatted (Asia/Riyadh) end date, or null while awaiting. */
  endDate: string | null;
  daysRemaining: number;
  /** 0–100, days elapsed / total days in the month. */
  progressPct: number;
}

/**
 * Dashboard widget for month-based (duration-model) Schedule plans.
 * Replaces the session-count widget for these plans. Shows either an
 * "awaiting schedule" notice or the active period (start → end) with a simple
 * progress indicator, motivational line, and the RenewalWizard when the period
 * is ending or has ended.
 */
export default function ScheduleStatusCard({
  uid,
  awaiting,
  ended,
  aboutToEnd,
  startDate,
  endDate,
  daysRemaining,
  progressPct,
}: Props) {
  const t = useTranslations('schedule');

  return (
    <section
      className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 relative overflow-hidden group"
      dir="rtl"
    >
      <div className="absolute top-0 end-0 w-32 h-32 bg-qwaam-pink-light rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform" />

      <h2 className="text-xl font-black text-text-main flex items-center gap-2">
        <span className="text-2xl">📅</span>
        {t('heading')}
      </h2>

      {awaiting ? (
        <div className="mt-4 bg-qwaam-pink-light border border-qwaam-pink/20 rounded-2xl p-5">
          <p className="font-black text-text-main">{t('awaitingTitle')}</p>
          <p className="text-sm font-bold text-text-muted mt-2 leading-relaxed">{t('awaiting')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-text-main mt-3 leading-relaxed">
            {t('activeCard', { startDate: startDate ?? '', endDate: endDate ?? '' })}
          </p>

          {/* Progress: days elapsed / total, with days-remaining label */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-black text-text-muted">
              <span className={ended ? 'text-rose-600' : daysRemaining <= 7 ? 'text-amber-600' : 'text-qwaam-pink'}>
                {ended ? t('endedTitle') : t('daysRemaining', { days: daysRemaining })}
              </span>
              <span dir="ltr">{endDate}</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner" dir="ltr">
              <div
                className={`h-full transition-all duration-1000 ease-out rounded-full ${
                  ended ? 'bg-green-500' : 'bg-gradient-to-r from-pink-400 to-qwaam-pink'
                }`}
                style={{ width: `${ended ? 100 : progressPct}%` }}
              />
            </div>
          </div>

          {ended ? (
            <p className="text-sm font-black text-rose-600 mt-4 leading-relaxed">
              {t('ended', { endDate: endDate ?? '' })}
            </p>
          ) : (
            <p className="text-sm font-bold text-text-muted mt-4 leading-relaxed">{t('motivation')}</p>
          )}
        </>
      )}

      {/* Renewal entry point — only when ending soon or ended */}
      {(ended || aboutToEnd) && <RenewalWizard uid={uid} />}
    </section>
  );
}
