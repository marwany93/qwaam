'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MealPlan, MealType } from '@/types';
import { normalizeMealRow, sumMacros, fastingHours } from '@/lib/meal-utils';
import ProgressToggleButton from '@/components/client/ProgressToggleButton';

const MEAL_TYPE_ICON: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

/**
 * Client-facing meal plan as a clear table (Path B). Desktop shows a real
 * table; mobile collapses into stacked per-meal cards. A day selector appears
 * only for multi-day plans. Adherence toggles are keyed `plan:{planId}:{rowId}`.
 */
export default function MealPlanTable({
  plan,
  todayDate,
  completedItemIds,
}: {
  plan: MealPlan;
  todayDate: string;
  completedItemIds: string[];
}) {
  const t = useTranslations('nutrition');
  const [dayIdx, setDayIdx] = useState(0);

  const days = Array.isArray(plan.days) ? plan.days : [];
  const activeDay = days[dayIdx] ?? days[0];
  const rows = (activeDay?.meals ?? []).map((m, i) => normalizeMealRow(m, dayIdx, i));
  const totals = sumMacros(rows);
  const done = new Set(completedItemIds);

  const fasting = fastingHours(plan.eatingWindow);
  const completedItemId = (rowId: string) => `plan:${plan.id}:${rowId}`;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Eating window header */}
      {plan.eatingWindow && fasting != null && (
        <div className="bg-qwaam-pink-light border border-qwaam-pink/20 rounded-2xl px-5 py-3.5 flex items-center gap-2 text-sm font-black text-qwaam-pink">
          <span className="text-lg">⏱️</span>
          <span>
            {t('eatingWindow', {
              start: plan.eatingWindow.start,
              end: plan.eatingWindow.end,
              hours: fasting,
            })}
          </span>
        </div>
      )}

      {/* Day selector — only for multi-day plans */}
      {days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => setDayIdx(i)}
              className={`px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
                i === dayIdx
                  ? 'bg-qwaam-pink text-white shadow-sm'
                  : 'bg-white text-text-muted border border-border-light hover:text-text-main'
              }`}
            >
              {d.dayName?.trim() || `${t('daySelector')} ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop table ── */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-3xl border border-border-light shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-light">
              <th className="px-4 py-3 text-xs font-black text-text-muted uppercase tracking-wider">{t('col.meal')}</th>
              <th className="px-4 py-3 text-xs font-black text-text-muted uppercase tracking-wider">{t('col.description')}</th>
              <th className="px-3 py-3 text-xs font-black text-text-muted uppercase tracking-wider text-center">{t('col.calories')}</th>
              <th className="px-3 py-3 text-xs font-black text-red-500 uppercase tracking-wider text-center">{t('col.protein')}</th>
              <th className="px-3 py-3 text-xs font-black text-green-600 uppercase tracking-wider text-center">{t('col.carbs')}</th>
              <th className="px-3 py-3 text-xs font-black text-yellow-600 uppercase tracking-wider text-center">{t('col.fats')}</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border-light/60 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-text-main">
                    <span>{MEAL_TYPE_ICON[r.mealType]}</span>
                    {t(`mealType.${r.mealType}`)}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-sm text-text-main">{r.description}</td>
                <td className="px-3 py-3 text-center font-black text-sm text-text-main" dir="ltr">{r.calories}</td>
                <td className="px-3 py-3 text-center font-black text-sm text-red-600" dir="ltr">{r.protein}g</td>
                <td className="px-3 py-3 text-center font-black text-sm text-green-700" dir="ltr">{r.carbs}g</td>
                <td className="px-3 py-3 text-center font-black text-sm text-yellow-700" dir="ltr">{r.fats}g</td>
                <td className="px-3 py-3 w-40">
                  <ProgressToggleButton
                    itemId={completedItemId(r.id)}
                    type="meal"
                    date={todayDate}
                    initialState={done.has(completedItemId(r.id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-qwaam-pink-light/50 border-t-2 border-qwaam-pink/20">
              <td className="px-4 py-3.5 font-black text-sm text-text-main" colSpan={2}>{t('dailyTotal')}</td>
              <td className="px-3 py-3.5 text-center font-black text-sm text-text-main" dir="ltr">{totals.calories}</td>
              <td className="px-3 py-3.5 text-center font-black text-sm text-red-600" dir="ltr">{totals.protein}g</td>
              <td className="px-3 py-3.5 text-center font-black text-sm text-green-700" dir="ltr">{totals.carbs}g</td>
              <td className="px-3 py-3.5 text-center font-black text-sm text-yellow-700" dir="ltr">{totals.fats}g</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Mobile stacked cards ── */}
      <div className="sm:hidden space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-border-light shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-text-main">
                <span>{MEAL_TYPE_ICON[r.mealType]}</span>
                {t(`mealType.${r.mealType}`)}
              </span>
              <span className="text-xs font-black text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg" dir="ltr">
                {r.calories} kcal
              </span>
            </div>
            <p className="font-bold text-sm text-text-main">{r.description}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 text-red-700 py-1.5 rounded-lg text-center leading-tight">
                <span className="block text-[9px] uppercase font-black opacity-60">{t('col.protein')}</span>
                <span className="font-black text-xs" dir="ltr">{r.protein}g</span>
              </div>
              <div className="bg-green-50 text-green-700 py-1.5 rounded-lg text-center leading-tight">
                <span className="block text-[9px] uppercase font-black opacity-60">{t('col.carbs')}</span>
                <span className="font-black text-xs" dir="ltr">{r.carbs}g</span>
              </div>
              <div className="bg-yellow-50 text-yellow-700 py-1.5 rounded-lg text-center leading-tight">
                <span className="block text-[9px] uppercase font-black opacity-60">{t('col.fats')}</span>
                <span className="font-black text-xs" dir="ltr">{r.fats}g</span>
              </div>
            </div>
            <ProgressToggleButton
              itemId={completedItemId(r.id)}
              type="meal"
              date={todayDate}
              initialState={done.has(completedItemId(r.id))}
            />
          </div>
        ))}

        {/* Daily total card */}
        <div className="bg-qwaam-pink-light border border-qwaam-pink/20 rounded-2xl p-4">
          <p className="font-black text-sm text-text-main mb-2">{t('dailyTotal')}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <span className="block text-[9px] uppercase font-black text-text-muted">{t('col.calories')}</span>
              <span className="font-black text-sm text-text-main" dir="ltr">{totals.calories}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-black text-red-500">{t('col.protein')}</span>
              <span className="font-black text-sm text-red-600" dir="ltr">{totals.protein}g</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-black text-green-600">{t('col.carbs')}</span>
              <span className="font-black text-sm text-green-700" dir="ltr">{totals.carbs}g</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-black text-yellow-600">{t('col.fats')}</span>
              <span className="font-black text-sm text-yellow-700" dir="ltr">{totals.fats}g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
