/**
 * Date helpers for the month-based Schedule subscription model.
 * ────────────────────────────────────────────────────────────
 * All calendar math is anchored to Asia/Riyadh (the same timezone the
 * dashboard already uses for its "today" calculations) so the 7-day reminder
 * and finished-state comparisons never drift by a day. Riyadh is a fixed
 * UTC+3 offset with no daylight-saving, which lets us do exact wall-clock
 * arithmetic without a timezone library.
 */

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, no DST

/** Wall-clock components of a UTC millis value, read in Asia/Riyadh. */
function riyadhParts(ms: number) {
  // Shifting by the offset lets the UTC getters read Riyadh local components.
  const d = new Date(ms + RIYADH_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(), // 0-based
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    milli: d.getUTCMilliseconds(),
  };
}

/**
 * Adds exactly one calendar month to `ms`, clamping to the last valid day for
 * short target months (e.g. Jan 31 → Feb 28/29). Returns UTC millis.
 * Computed on the Riyadh wall clock, preserving the original time-of-day.
 */
export function addOneMonth(ms: number): number {
  const p = riyadhParts(ms);

  let targetYear = p.year;
  let targetMonth = p.month + 1;
  if (targetMonth > 11) {
    targetMonth = 0;
    targetYear += 1;
  }

  // Last day of the target month (day 0 of the following month).
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(p.day, lastDay);

  const utcForRiyadhWall = Date.UTC(
    targetYear,
    targetMonth,
    day,
    p.hour,
    p.minute,
    p.second,
    p.milli,
  );
  // Convert the Riyadh wall-clock instant back to a real UTC timestamp.
  return utcForRiyadhWall - RIYADH_OFFSET_MS;
}

/** Milliseconds in one day — handy for reminder-window comparisons. */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Formats a millis timestamp as a human date in Asia/Riyadh.
 * locale 'ar' → Arabic (Egyptian) month names; anything else → English.
 */
export function formatDateRiyadh(ms: number, locale: string = 'ar'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(ms));
}
