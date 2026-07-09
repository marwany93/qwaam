/**
 * Shared display math for the month-based (duration-model) Schedule subscription.
 * ──────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the start/end/days-remaining/progress derivations
 * used by BOTH the client dashboard (ScheduleStatusCard) and the coach detail
 * page (ScheduleManagerCard). Pure — no React, no Firestore — so it is safe to
 * call from a Server Component or a Client Component. All calendar formatting is
 * Asia/Riyadh via `formatDateRiyadh` (see date-utils).
 */
import { ONE_DAY_MS, formatDateRiyadh } from '@/lib/date-utils';

export interface ScheduleDisplay {
  /** No start date anchored yet (awaiting schedule upload or a manual start). */
  awaiting: boolean;
  /** now >= endsAt. */
  ended: boolean;
  /** 0 < (endsAt - now) <= 7 days. */
  aboutToEnd: boolean;
  /** Whole days left in the month period (0 once ended). */
  daysRemaining: number;
  /** 0–100, days elapsed / total days in the period. */
  progressPct: number;
  /** Preformatted (Asia/Riyadh) start date, or null while awaiting. */
  startDate: string | null;
  /** Preformatted (Asia/Riyadh) end date, or null while awaiting. */
  endDate: string | null;
}

/**
 * Derive the schedule display state from the two stored millis anchors.
 * `now` is injectable so tests/renders are deterministic; defaults to Date.now().
 * This is purely date-driven — callers gate on `billingModel==='duration'` /
 * `isSchedulePlan(planId)` as appropriate.
 */
export function computeScheduleDisplay(
  startAt: number | null,
  endsAt: number | null,
  locale: string,
  now: number = Date.now(),
): ScheduleDisplay {
  const msLeft = endsAt != null ? endsAt - now : null;
  const awaiting = startAt == null;
  const ended = endsAt != null && now >= endsAt;
  const aboutToEnd = msLeft != null && msLeft > 0 && msLeft <= 7 * ONE_DAY_MS;
  const daysRemaining = msLeft != null && msLeft > 0 ? Math.ceil(msLeft / ONE_DAY_MS) : 0;
  const totalDays =
    startAt != null && endsAt != null
      ? Math.max(1, Math.round((endsAt - startAt) / ONE_DAY_MS))
      : 0;
  const progressPct =
    totalDays > 0
      ? Math.min(100, Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100)))
      : 0;
  const startDate = startAt != null ? formatDateRiyadh(startAt, locale) : null;
  const endDate = endsAt != null ? formatDateRiyadh(endsAt, locale) : null;

  return { awaiting, ended, aboutToEnd, daysRemaining, progressPct, startDate, endDate };
}
