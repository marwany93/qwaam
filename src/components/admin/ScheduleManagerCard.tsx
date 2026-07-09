'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDaysIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { setScheduleStartDate } from '@/actions/admin-actions';
import { computeScheduleDisplay } from '@/lib/schedule-display';

interface Props {
  traineeUid: string;
  planId: string;
  billingModel?: string;
  status?: string;
  /** millis or null — NEVER a raw Firestore Timestamp (RSC→client safe). */
  scheduleStartAt: number | null;
  scheduleEndsAt: number | null;
  locale: string;
}

/** millis (or now) → 'YYYY-MM-DD' read in Asia/Riyadh, for the date input. */
function toRiyadhDateInput(ms: number | null): string {
  const d = ms != null ? new Date(ms) : new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Coach mirror of the client's ScheduleStatusCard (Issue #11). For SCHEDULE
 * plans, replaces the session card: shows the month start→end + status, and lets
 * the coach set/edit the start date. Setting a date on a grandfathered
 * (session-model) trainee converts them to the duration model.
 */
export default function ScheduleManagerCard({
  traineeUid,
  billingModel,
  scheduleStartAt,
  scheduleEndsAt,
  locale,
}: Props) {
  const t = useTranslations('coach.scheduleManager');
  const router = useRouter();

  const isDuration = billingModel === 'duration';
  const hasStart = scheduleStartAt != null;
  const showDates = isDuration && hasStart;
  const sd = computeScheduleDisplay(scheduleStartAt, scheduleEndsAt, locale);

  const [editing, setEditing] = useState(false);
  const [dateStr, setDateStr] = useState(() => toRiyadhDateInput(scheduleStartAt));
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Interpret the picked calendar day as midnight Asia/Riyadh (UTC+3, no DST),
  // matching the model's Riyadh wall-clock anchoring.
  const pickedMs = () => new Date(`${dateStr}T00:00:00+03:00`).getTime();

  const persist = () => {
    const ms = pickedMs();
    if (!Number.isFinite(ms)) {
      setError(t('genericError'));
      return;
    }
    setError('');
    startTransition(async () => {
      const res = await setScheduleStartDate(traineeUid, ms);
      if (!res.success) {
        setError(res.error || t('genericError'));
        return;
      }
      setShowConfirm(false);
      setEditing(false);
      router.refresh();
    });
  };

  // Converting a session-model (grandfathered) trainee is a UX-changing action →
  // require an explicit confirm. Editing an existing duration date saves directly.
  const handleSave = () => {
    if (!isDuration) setShowConfirm(true);
    else persist();
  };

  return (
    <div
      className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm p-6"
      dir="rtl"
      data-testid="schedule-manager-card"
    >
      <h3 className="text-xl font-black text-text-main mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-qwaam-pink-light flex items-center justify-center text-qwaam-pink">
          <CalendarDaysIcon className="w-5 h-5" />
        </span>
        {t('heading')}
      </h3>

      {showDates ? (
        <div className="space-y-4" data-testid="schedule-dates">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-border-light">
              <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">{t('startLabel')}</p>
              <p className="font-black text-text-main text-sm" data-testid="schedule-start-date" dir="ltr">{sd.startDate}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-border-light">
              <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">{t('endLabel')}</p>
              <p className="font-black text-text-main text-sm" data-testid="schedule-end-date" dir="ltr">{sd.endDate}</p>
            </div>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden" dir="ltr">
            <div
              className={`h-full transition-all duration-500 ${sd.ended ? 'bg-green-500' : 'bg-qwaam-pink'}`}
              style={{ width: `${sd.ended ? 100 : sd.progressPct}%` }}
            />
          </div>
          <p className={`text-xs font-black ${sd.ended ? 'text-green-600' : 'text-text-muted'}`}>
            {sd.ended ? t('ended') : t('daysRemaining', { days: sd.daysRemaining })}
          </p>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              data-testid="schedule-edit-btn"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-qwaam-pink hover:text-pink-600 transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" />
              {t('editCta')}
            </button>
          )}
        </div>
      ) : (
        <div
          className="bg-qwaam-pink-light border border-qwaam-pink/20 rounded-2xl p-4 mb-4"
          data-testid="schedule-no-start"
        >
          <p className="font-black text-text-main text-sm">{t('noStartTitle')}</p>
          <p className="text-xs font-bold text-text-muted mt-1 leading-relaxed">{t('noStartDesc')}</p>
        </div>
      )}

      {/* Date control — always available (set for no-start, edit for existing) */}
      {(editing || !showDates) && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-black text-text-muted uppercase tracking-wider">{t('pickLabel')}</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            disabled={isPending}
            data-testid="schedule-date-input"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold bg-white transition-colors"
          />
          <p className="text-[11px] font-bold text-text-muted leading-relaxed">{t('pickRealDateHint')}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              data-testid="schedule-save-btn"
              className="flex-1 py-3 rounded-xl font-black text-white bg-qwaam-pink shadow-md hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? t('saving') : t('saveCta')}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(false); setError(''); }}
                disabled={isPending}
                className="px-4 py-3 rounded-xl font-bold text-text-muted border-2 border-border-light hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {t('confirmCancel')}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs font-bold text-red-500 mt-3 bg-red-50 p-2 rounded-lg">{error}</p>}

      {/* Confirmation before converting a grandfathered (session-model) trainee */}
      {showConfirm && (
        <div className="mt-4 bg-yellow-50 border-2 border-qwaam-yellow rounded-2xl p-4" data-testid="schedule-confirm">
          <p className="font-black text-text-main text-sm">{t('confirmConvertTitle')}</p>
          <p className="text-xs font-bold text-text-muted mt-1 leading-relaxed">{t('confirmConvertBody')}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={persist}
              disabled={isPending}
              data-testid="schedule-confirm-yes"
              className="flex-1 py-2.5 rounded-xl font-black text-white bg-qwaam-pink shadow-md hover:bg-pink-600 transition-all disabled:opacity-50"
            >
              {isPending ? t('saving') : t('confirmYes')}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl font-bold text-text-muted border-2 border-border-light hover:bg-white transition-all disabled:opacity-50"
            >
              {t('confirmCancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
