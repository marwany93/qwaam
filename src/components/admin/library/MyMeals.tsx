'use client';

import { useEffect, useState, useTransition } from 'react';
import { getSavedMeals, deleteSavedMeal, type SavedMeal } from '@/actions/admin-actions';
import {
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const MACRO_STYLE = {
  Calories: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'سعرات' },
  Protein:  { bg: 'bg-red-50',    text: 'text-red-700',    label: 'بروتين' },
  Carbs:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'كارب' },
  Fat:      { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'دهون' },
} as const;

export default function MyMeals() {
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, startDeleteTx] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await getSavedMeals();
    if (res.success && res.data) {
      setMeals(res.data);
    } else {
      setError(res.error || 'فشل تحميل الوجبات.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // load is stable for this mount; no need to include it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوجبة من قائمتك؟')) return;

    setDeletingId(id);
    startDeleteTx(async () => {
      const res = await deleteSavedMeal(id);
      if (res.success) {
        // Optimistic local removal so the UI updates immediately
        setMeals((prev) => prev.filter((m) => m.id !== id));
      } else {
        setError(res.error || 'فشل حذف الوجبة.');
      }
      setDeletingId(null);
    });
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" dir="rtl">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl overflow-hidden border border-border-light shadow-sm animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded" />
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[...Array(4)].map((_, j) => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error && meals.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center" dir="rtl">
        <p className="font-black mb-3">{error}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────
  if (meals.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-dashed border-border-light text-center" dir="rtl">
        <span className="text-5xl block mb-4">🔖</span>
        <h3 className="font-black text-text-main text-lg mb-2">لا توجد وجبات محفوظة</h3>
        <p className="font-bold text-text-muted text-sm max-w-md mx-auto">
          لا توجد وجبات محفوظة حالياً. يمكنك البحث عن وجبات وحفظها من تبويب البحث.
        </p>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────
  return (
    <div className="space-y-4" dir="rtl">
      {/* Inline error banner — visible even when we have meals, e.g. delete failed */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 font-bold text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {meals.map((meal) => {
          const macros = [
            { key: 'Calories' as const, value: meal.calories },
            { key: 'Protein'  as const, value: meal.macros.protein },
            { key: 'Carbs'    as const, value: meal.macros.carbs },
            { key: 'Fat'      as const, value: meal.macros.fat },
          ];
          const isDeleting = deletingId === meal.id;

          return (
            <article
              key={meal.id}
              className={`bg-white rounded-3xl overflow-hidden border border-border-light shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {meal.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meal.image}
                    alt={meal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                )}

                {/* Source badge */}
                <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/90 text-[10px] font-black text-text-muted uppercase tracking-wider shadow-sm">
                  {meal.source}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-extrabold text-base text-text-main mb-3 line-clamp-2" dir="ltr" style={{ textAlign: 'right' }}>
                  {meal.title}
                </h3>

                {/* Macros */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {macros.map(({ key, value }) => {
                    const style = MACRO_STYLE[key];
                    const unit = key === 'Calories' ? '' : 'g';
                    return (
                      <div key={key} className={`${style.bg} ${style.text} rounded-xl py-2 text-center leading-tight`}>
                        <div className="text-[9px] font-black uppercase opacity-70 mb-0.5">{style.label}</div>
                        <div className="font-black text-xs">
                          {value != null ? `${value}${unit}` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTAs */}
                <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
                  {meal.sourceUrl ? (
                    <a
                      href={meal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-qwaam-pink-light text-qwaam-pink hover:bg-qwaam-pink hover:text-white font-black text-xs transition-all"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      عرض الوصفة
                    </a>
                  ) : (
                    <span className="py-2.5 rounded-xl bg-gray-100 text-text-muted font-black text-xs text-center">
                      لا يوجد رابط
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(meal.id)}
                    disabled={isDeleting}
                    title="حذف من قائمتي"
                    className="flex items-center justify-center w-10 rounded-xl bg-gray-50 text-text-muted hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
