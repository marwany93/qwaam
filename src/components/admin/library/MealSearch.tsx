'use client';

import { useState, useTransition } from 'react';
import { searchRecipes, type SpoonacularRecipe } from '@/actions/spoonacular-actions';
import { saveSpoonacularMealToDb } from '@/actions/admin-actions';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  UsersIcon,
  BookmarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

/**
 * Extracts a single nutrient value from a Spoonacular recipe by name.
 * Returns the rounded amount + unit, or null if not present.
 */
function getNutrient(recipe: SpoonacularRecipe, name: string): { amount: number; unit: string } | null {
  const found = recipe.nutrition?.nutrients?.find(
    (n) => n.name.toLowerCase() === name.toLowerCase(),
  );
  if (!found) return null;
  return { amount: Math.round(found.amount), unit: found.unit };
}

const MACRO_STYLE = {
  Calories: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'سعرات' },
  Protein:  { bg: 'bg-red-50',    text: 'text-red-700',    label: 'بروتين' },
  Carbohydrates: { bg: 'bg-green-50', text: 'text-green-700', label: 'كارب' },
  Fat:      { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'دهون' },
} as const;

type MacroKey = keyof typeof MACRO_STYLE;

export default function MealSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpoonacularRecipe[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Per-card save state: maps recipe id → 'saving' | 'saved' | 'error'
  const [saveState, setSaveState] = useState<Record<number, 'saving' | 'saved' | 'error'>>({});

  const handleSave = async (recipe: SpoonacularRecipe) => {
    setSaveState((prev) => ({ ...prev, [recipe.id]: 'saving' }));

    const res = await saveSpoonacularMealToDb({
      sourceId: recipe.id,
      title: recipe.title,
      image: recipe.image ?? null,
      sourceUrl: recipe.sourceUrl ?? null,
      calories: getNutrient(recipe, 'Calories')?.amount ?? null,
      protein:  getNutrient(recipe, 'Protein')?.amount ?? null,
      carbs:    getNutrient(recipe, 'Carbohydrates')?.amount ?? null,
      fat:      getNutrient(recipe, 'Fat')?.amount ?? null,
    });

    setSaveState((prev) => ({
      ...prev,
      [recipe.id]: res.success ? 'saved' : 'error',
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isPending) return;

    startTransition(async () => {
      setError('');
      setHasSearched(true);
      const res = await searchRecipes(query);
      if (res.success && res.data) {
        setResults(res.data);
      } else {
        setResults([]);
        setError(res.error || 'حدث خطأ غير متوقع.');
      }
    });
  };

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Search bar ────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-3xl p-5 border border-border-light shadow-sm flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن وصفة (مثال: chicken rice, salad, pasta)..."
            className="w-full pr-12 pl-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-border-light focus:border-qwaam-pink focus:bg-white outline-none font-bold text-sm transition-all"
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isPending}
          className="px-6 py-3.5 rounded-2xl bg-qwaam-pink text-white font-black shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isPending ? 'جاري البحث...' : 'بحث'}
        </button>
      </form>

      {/* ── Error banner ──────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold text-sm">
          {error}
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────── */}
      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-border-light shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[...Array(4)].map((_, j) => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {!isPending && hasSearched && !error && results.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-border-light text-center">
          <span className="text-5xl block grayscale opacity-50 mb-4">🍽️</span>
          <p className="font-bold text-text-muted">لم نجد وصفات تطابق &quot;{query}&quot;.</p>
        </div>
      )}

      {/* ── Initial hint ──────────────────────────────────── */}
      {!isPending && !hasSearched && (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-border-light text-center">
          <span className="text-5xl block mb-4">🥗</span>
          <p className="font-bold text-text-muted">ابدأ بكتابة اسم وجبة أو مكوّن لاكتشاف الوصفات.</p>
        </div>
      )}

      {/* ── Results grid ──────────────────────────────────── */}
      {!isPending && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((recipe) => {
            const macros: { key: MacroKey; value: { amount: number; unit: string } | null }[] = [
              { key: 'Calories',      value: getNutrient(recipe, 'Calories') },
              { key: 'Protein',       value: getNutrient(recipe, 'Protein') },
              { key: 'Carbohydrates', value: getNutrient(recipe, 'Carbohydrates') },
              { key: 'Fat',           value: getNutrient(recipe, 'Fat') },
            ];

            return (
              <article
                key={recipe.id}
                className="bg-white rounded-3xl overflow-hidden border border-border-light shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {recipe.image ? (
                    // Spoonacular images are hosted externally; using a plain img
                    // avoids the Next.js Image-domain config requirement.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-extrabold text-base text-text-main mb-2 line-clamp-2" dir="ltr" style={{ textAlign: 'right' }}>
                    {recipe.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs font-bold text-text-muted mb-4">
                    {recipe.readyInMinutes && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {recipe.readyInMinutes} د
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        {recipe.servings}
                      </span>
                    )}
                  </div>

                  {/* Macros grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {macros.map(({ key, value }) => {
                      const style = MACRO_STYLE[key];
                      return (
                        <div key={key} className={`${style.bg} ${style.text} rounded-xl py-2 text-center leading-tight`}>
                          <div className="text-[9px] font-black uppercase opacity-70 mb-0.5">{style.label}</div>
                          <div className="font-black text-xs">
                            {value ? `${value.amount}${value.unit === 'kcal' ? '' : value.unit}` : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTAs — pushed to bottom of flex column */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    {recipe.sourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-qwaam-pink-light text-qwaam-pink hover:bg-qwaam-pink hover:text-white font-black text-xs transition-all"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        عرض الوصفة
                      </a>
                    ) : (
                      <button
                        disabled
                        className="py-2.5 rounded-xl bg-gray-100 text-text-muted font-black text-xs cursor-not-allowed"
                      >
                        لا يوجد رابط
                      </button>
                    )}

                    {(() => {
                      const state = saveState[recipe.id];
                      const saving = state === 'saving';
                      const saved  = state === 'saved';
                      const errored = state === 'error';
                      return (
                        <button
                          onClick={() => handleSave(recipe)}
                          disabled={saving || saved}
                          title={errored ? 'فشل الحفظ — حاول مجدداً' : ''}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs transition-all ${
                            saved
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : errored
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-qwaam-yellow/30 text-text-main hover:bg-qwaam-yellow'
                          } disabled:opacity-70`}
                        >
                          {saved ? (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              محفوظة
                            </>
                          ) : saving ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              جاري الحفظ
                            </>
                          ) : (
                            <>
                              <BookmarkIcon className="w-4 h-4" />
                              {errored ? 'إعادة المحاولة' : 'حفظ في وجباتي'}
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
