/**
 * Meal-plan display helpers.
 * ──────────────────────────
 * Pure functions shared by the coach builder and the client table so both
 * agree on how legacy rows are normalized and how daily totals / fasting hours
 * are derived. No I/O, no framework deps — safe to import anywhere.
 */

import type { MealType } from '@/types';

export interface NormalizedMealRow {
  id: string;
  mealType: MealType;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Coerces a stored meal row (new OR legacy shape) into a fully-populated row.
 * Legacy rows lack `id`/`description`/macros — we synthesize a positional id,
 * fall back `description ?? mealName ?? '—'`, and treat missing macros as 0.
 */
export function normalizeMealRow(row: any, dayIdx: number, rowIdx: number): NormalizedMealRow {
  return {
    id: typeof row?.id === 'string' && row.id ? row.id : `d${dayIdx}r${rowIdx}`,
    mealType: (row?.mealType as MealType) ?? 'snack',
    description: (row?.description || row?.mealName || '—') as string,
    calories: Number(row?.calories) || 0,
    protein: Number(row?.protein) || 0,
    carbs: Number(row?.carbs) || 0,
    fats: Number(row?.fats) || 0,
  };
}

/** Sums calories + the 3 macros across a day's normalized rows. */
export function sumMacros(rows: NormalizedMealRow[]): MacroTotals {
  return rows.reduce<MacroTotals>(
    (t, r) => ({
      calories: t.calories + r.calories,
      protein: t.protein + r.protein,
      carbs: t.carbs + r.carbs,
      fats: t.fats + r.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

/** Minutes since midnight for an "HH:MM" string, or NaN if malformed. */
function toMinutes(hhmm: string): number {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

/**
 * Fasting hours implied by an eating window, i.e. 24 − window length.
 * Handles overnight windows (end <= start wraps to next day). Returns null
 * when the window is unset or malformed. Rounded to 1 decimal.
 */
export function fastingHours(win?: { start: string; end: string } | null): number | null {
  if (!win?.start || !win?.end) return null;
  const start = toMinutes(win.start);
  const end = toMinutes(win.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  let windowMin = end - start;
  if (windowMin <= 0) windowMin += 24 * 60; // overnight eating window
  const fastingMin = 24 * 60 - windowMin;
  return Math.round((fastingMin / 60) * 10) / 10;
}
