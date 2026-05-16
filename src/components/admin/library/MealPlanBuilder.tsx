'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  createMealPlan,
  getMealPlans,
  deleteMealPlan,
} from '@/actions/meal-plan-actions';
import { getSavedMeals, type SavedMeal } from '@/actions/admin-actions';
import type { MealPlan, MealPlanDay } from '@/types';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  FireIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// ── Meal-type constants ───────────────────────────────────────────────────────

const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 إفطار' },
  { value: 'lunch',     label: '☀️ غداء' },
  { value: 'dinner',    label: '🌙 عشاء' },
  { value: 'snack',     label: '🍎 وجبة خفيفة' },
] as const;

// Helper: best-effort default day name in Arabic
const arabicDayName = (idx: number) => {
  const names = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];
  return `اليوم ${names[idx] ?? idx + 1}`;
};

// Helper: sum calories across the whole draft plan
const draftTotalCalories = (days: MealPlanDay[]): number =>
  days.reduce(
    (sum, d) => sum + d.meals.reduce((s, m) => s + (Number(m.calories) || 0), 0),
    0,
  );

// ── Main component ────────────────────────────────────────────────────────────

export default function MealPlanBuilder() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTx] = useTransition();

  // ── Initial fetch ──────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    const [plansRes, mealsRes] = await Promise.all([getMealPlans(), getSavedMeals()]);

    if (plansRes.success && plansRes.data) setPlans(plansRes.data);
    else setLoadError(plansRes.error || 'فشل تحميل الخطط.');

    if (mealsRes.success && mealsRes.data) setSavedMeals(mealsRes.data);
    // Don't fail the whole screen if savedMeals fails — the list view still works.

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────
  const handleDelete = (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
    setDeletingId(planId);
    startTx(async () => {
      const res = await deleteMealPlan(planId);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
      } else {
        alert(res.error || 'فشل الحذف.');
      }
      setDeletingId(null);
    });
  };

  const handleCreated = (newPlan: MealPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
    setIsCreating(false);
  };

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" dir="rtl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-white rounded-3xl border border-border-light shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Builder view ───────────────────────────────────────────
  if (isCreating) {
    return (
      <BuilderForm
        savedMeals={savedMeals}
        onCancel={() => setIsCreating(false)}
        onCreated={handleCreated}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────
  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xl font-black text-text-main">الخطط الغذائية</h3>
          <p className="text-sm font-bold text-text-muted">إنشاء وإدارة خطط غذائية متعددة الأيام لمتدربيك.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-qwaam-pink text-white font-black text-sm shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-95 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          إنشاء خطة جديدة
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-border-light text-center">
          <span className="text-5xl block mb-4">🗓️</span>
          <h3 className="font-black text-text-main text-lg mb-2">لا توجد خطط غذائية بعد</h3>
          <p className="font-bold text-text-muted text-sm max-w-md mx-auto">
            ابدأ بإنشاء خطتك الأولى من زر &quot;إنشاء خطة جديدة&quot;. ستظهر هنا بعد الحفظ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isDeleting = deletingId === plan.id;
            return (
              <article
                key={plan.id}
                className={`bg-white rounded-3xl p-6 border border-border-light shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col gap-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-black text-text-main text-lg leading-tight line-clamp-2">{plan.name}</h4>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    disabled={isDeleting}
                    title="حذف الخطة"
                    className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  >
                    {isDeleting ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {plan.description && (
                  <p className="text-xs font-bold text-text-muted leading-relaxed line-clamp-2">{plan.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border-light/50">
                  <div className="bg-orange-50 text-orange-700 rounded-xl py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase opacity-70 mb-0.5">
                      <FireIcon className="w-3 h-3" />
                      السعرات
                    </div>
                    <div className="font-black text-sm">{plan.totalCalories}</div>
                  </div>
                  <div className="bg-qwaam-pink-light text-qwaam-pink rounded-xl py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase opacity-70 mb-0.5">
                      <CalendarDaysIcon className="w-3 h-3" />
                      أيام
                    </div>
                    <div className="font-black text-sm">{plan.days.length}</div>
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

// ── Builder Form (separate component so its state resets cleanly) ─────────────

function BuilderForm({
  savedMeals,
  onCancel,
  onCreated,
}: {
  savedMeals: SavedMeal[];
  onCancel: () => void;
  onCreated: (plan: MealPlan) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<MealPlanDay[]>([
    { dayName: arabicDayName(0), meals: [] },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totalCalories = draftTotalCalories(days);

  // ── Day operations ─────────────────────────────────────────
  const addDay = () =>
    setDays((prev) => [...prev, { dayName: arabicDayName(prev.length), meals: [] }]);

  const removeDay = (idx: number) =>
    setDays((prev) => prev.filter((_, i) => i !== idx));

  const renameDay = (idx: number, val: string) =>
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, dayName: val } : d)));

  // ── Meal operations ────────────────────────────────────────
  const addMeal = (dayIdx: number, mealType: string, savedMealId: string) => {
    const meal = savedMeals.find((m) => m.id === savedMealId);
    if (!meal) return;

    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              meals: [
                ...d.meals,
                {
                  mealType,
                  savedMealId: meal.id,
                  mealName: meal.title,
                  calories: meal.calories ?? 0,
                },
              ],
            }
          : d,
      ),
    );
  };

  const removeMeal = (dayIdx: number, mealIdx: number) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, meals: d.meals.filter((_, j) => j !== mealIdx) } : d,
      ),
    );

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('يرجى تعبئة اسم الخطة.');
      return;
    }
    if (days.length === 0) {
      setError('يجب إضافة يوم واحد على الأقل.');
      return;
    }
    if (days.some((d) => d.meals.length === 0)) {
      setError('كل يوم يجب أن يحتوي على وجبة واحدة على الأقل.');
      return;
    }

    setSaving(true);
    const res = await createMealPlan({
      name: name.trim(),
      description: description.trim() || undefined,
      days,
    });
    setSaving(false);

    if (!res.success || !res.id) {
      setError(res.error || 'فشل حفظ الخطة.');
      return;
    }

    // Build the freshly-created plan locally so the list updates without
    // needing a second round-trip to refetch.
    onCreated({
      id: res.id,
      coachUid: '',           // server-owned, list view doesn't display it
      name: name.trim(),
      description: description.trim() || undefined,
      days,
      totalCalories,
      createdAt: Date.now(),
    });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm font-black text-text-muted hover:text-qwaam-pink transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          رجوع للقائمة
        </button>
        <div className="bg-orange-50 text-orange-700 rounded-xl px-4 py-2 font-black text-sm flex items-center gap-2">
          <FireIcon className="w-4 h-4" />
          المجموع: {totalCalories} سعرة
        </div>
      </div>

      {/* Plan metadata */}
      <div className="bg-white rounded-3xl p-6 border border-border-light shadow-sm space-y-4">
        <h3 className="font-black text-text-main text-lg">معلومات الخطة</h3>
        <div>
          <label className="block text-xs font-black text-text-muted mb-1.5 uppercase tracking-wider">
            اسم الخطة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: خطة فقدان الوزن — أسبوع 1"
            className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold transition-colors bg-gray-50 focus:bg-white"
            disabled={saving}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-black text-text-muted mb-1.5 uppercase tracking-wider">
            وصف الخطة (اختياري)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="ملاحظات للمتدرب: أهداف الخطة، إرشادات التحضير، إلخ."
            className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold transition-colors bg-gray-50 focus:bg-white resize-none"
            disabled={saving}
          />
        </div>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {days.map((day, dayIdx) => (
          <DayCard
            key={dayIdx}
            day={day}
            dayIdx={dayIdx}
            savedMeals={savedMeals}
            canRemove={days.length > 1}
            onRename={(val) => renameDay(dayIdx, val)}
            onRemove={() => removeDay(dayIdx)}
            onAddMeal={(mealType, savedMealId) => addMeal(dayIdx, mealType, savedMealId)}
            onRemoveMeal={(mealIdx) => removeMeal(dayIdx, mealIdx)}
            disabled={saving}
          />
        ))}

        <button
          type="button"
          onClick={addDay}
          disabled={saving}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-qwaam-pink/40 text-qwaam-pink font-black text-sm hover:bg-qwaam-pink-light/30 hover:border-qwaam-pink transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          إضافة يوم
        </button>
      </div>

      {/* Error + Save */}
      {error && (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-bold text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-qwaam-pink text-white font-black text-base shadow-lg shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          'حفظ الخطة'
        )}
      </button>
    </form>
  );
}

// ── Day Card (sub-component) ──────────────────────────────────────────────────

function DayCard({
  day, dayIdx, savedMeals, canRemove, disabled,
  onRename, onRemove, onAddMeal, onRemoveMeal,
}: {
  day: MealPlanDay;
  dayIdx: number;
  savedMeals: SavedMeal[];
  canRemove: boolean;
  disabled: boolean;
  onRename: (val: string) => void;
  onRemove: () => void;
  onAddMeal: (mealType: string, savedMealId: string) => void;
  onRemoveMeal: (mealIdx: number) => void;
}) {
  const [pickerMealType, setPickerMealType] = useState<string>('breakfast');
  const [pickerMealId, setPickerMealId] = useState<string>('');

  const dayCalories = day.meals.reduce((s, m) => s + (m.calories || 0), 0);

  const handleAdd = () => {
    if (!pickerMealId) return;
    onAddMeal(pickerMealType, pickerMealId);
    setPickerMealId(''); // reset selection so the next add is intentional
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-border-light shadow-sm space-y-4">

      {/* Day header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <span className="w-10 h-10 rounded-xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center font-black text-base shrink-0">
            {dayIdx + 1}
          </span>
          <input
            type="text"
            value={day.dayName}
            onChange={(e) => onRename(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border-2 border-transparent focus:border-qwaam-pink focus:bg-white outline-none font-black text-sm transition-all"
          />
        </div>
        <div className="text-xs font-black text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg shrink-0">
          {dayCalories} سعرة
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            title="حذف اليوم"
            className="p-2 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Meals in this day */}
      {day.meals.length > 0 && (
        <ul className="space-y-2">
          {day.meals.map((m, mealIdx) => {
            const typeLabel = MEAL_TYPES.find((t) => t.value === m.mealType)?.label ?? m.mealType;
            return (
              <li
                key={mealIdx}
                className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-border-light/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-black text-text-muted shrink-0">{typeLabel}</span>
                  <span className="font-bold text-sm text-text-main truncate" dir="ltr" style={{ textAlign: 'right' }}>
                    {m.mealName}
                  </span>
                </div>
                <span className="text-xs font-black text-orange-700 shrink-0">{m.calories} kcal</span>
                <button
                  type="button"
                  onClick={() => onRemoveMeal(mealIdx)}
                  disabled={disabled}
                  className="p-1 rounded text-red-300 hover:text-red-600 transition-colors shrink-0"
                  title="إزالة الوجبة"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Meal picker */}
      {savedMeals.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-3 text-xs font-bold text-center">
          لا توجد وجبات محفوظة بعد. احفظ وجبات من تبويب البحث أولاً.
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-stretch">
          <select
            value={pickerMealType}
            onChange={(e) => setPickerMealType(e.target.value)}
            disabled={disabled}
            className="px-3 py-2.5 rounded-xl bg-white border-2 border-border-light focus:border-qwaam-pink outline-none text-xs font-black"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={pickerMealId}
            onChange={(e) => setPickerMealId(e.target.value)}
            disabled={disabled}
            className="px-3 py-2.5 rounded-xl bg-white border-2 border-border-light focus:border-qwaam-pink outline-none text-xs font-bold truncate"
          >
            <option value="">— اختر وجبة محفوظة —</option>
            {savedMeals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.calories ?? 0} kcal)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled || !pickerMealId}
            className="px-4 py-2.5 rounded-xl bg-qwaam-pink text-white font-black text-xs hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            إضافة وجبة
          </button>
        </div>
      )}
    </div>
  );
}
