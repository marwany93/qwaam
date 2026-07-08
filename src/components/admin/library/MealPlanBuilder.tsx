'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  createMealPlan,
  getMealPlans,
  deleteMealPlan,
} from '@/actions/meal-plan-actions';
import { getSavedMeals, getClients, type SavedMeal } from '@/actions/admin-actions';
import type { MealPlan, MealPlanDay, MealPlanMealRow, MealType, QwaamUser } from '@/types';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  FireIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// ── Meal-type constants ───────────────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_ICON: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

// A draft row while authoring — macros kept as strings so the inputs can be
// cleared without snapping to 0. Coerced to numbers only at save time.
interface DraftRow {
  id: string;
  mealType: MealType;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  source: MealPlanMealRow['source'];
  savedMealId?: string;
}

interface DraftDay {
  dayName: string;
  meals: DraftRow[];
}

const newRowId = (n: number) => `tmp-${n}-${Math.round(Math.random() * 1e6)}`;

const draftToRow = (r: DraftRow): MealPlanMealRow => ({
  id: r.id,
  mealType: r.mealType,
  description: r.description.trim(),
  calories: Number(r.calories) || 0,
  protein: Number(r.protein) || 0,
  carbs: Number(r.carbs) || 0,
  fats: Number(r.fats) || 0,
  source: r.source,
  ...(r.savedMealId ? { savedMealId: r.savedMealId } : {}),
});

const emptyDraftDay = (idx: number, dayName: string): DraftDay => ({
  dayName: `${dayName} ${idx + 1}`,
  meals: [],
});

// ── Main component ────────────────────────────────────────────────────────────

export default function MealPlanBuilder() {
  const t = useTranslations('nutrition');
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [trainees, setTrainees] = useState<QwaamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    const [plansRes, mealsRes, traineesRes] = await Promise.all([
      getMealPlans(),
      getSavedMeals(),
      getClients(),
    ]);
    if (plansRes.success && plansRes.data) setPlans(plansRes.data);
    else setLoadError(plansRes.error || 'فشل تحميل الخطط.');
    if (mealsRes.success && mealsRes.data) setSavedMeals(mealsRes.data);
    if (Array.isArray(traineesRes)) setTrainees(traineesRes);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
    setDeletingId(planId);
    const res = await deleteMealPlan(planId);
    if (res.success) setPlans((prev) => prev.filter((p) => p.id !== planId));
    else alert(res.error || 'فشل الحذف.');
    setDeletingId(null);
  };

  const handleCreated = (newPlan: MealPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" dir="rtl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-white rounded-3xl border border-border-light shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (isCreating) {
    return (
      <BuilderForm
        savedMeals={savedMeals}
        trainees={trainees}
        onCancel={() => setIsCreating(false)}
        onCreated={handleCreated}
      />
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xl font-black text-text-main">{t('builder.planTitle')}</h3>
          <p className="text-sm font-bold text-text-muted">{t('builder.planSubtitle')}</p>
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

                {plan.eatingWindow && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-qwaam-pink bg-qwaam-pink-light rounded-lg px-2.5 py-1 w-fit">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span dir="ltr">{plan.eatingWindow.start}–{plan.eatingWindow.end}</span>
                  </div>
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

// ── Builder Form ──────────────────────────────────────────────────────────────

function BuilderForm({
  savedMeals,
  trainees,
  onCancel,
  onCreated,
}: {
  savedMeals: SavedMeal[];
  trainees: QwaamUser[];
  onCancel: () => void;
  onCreated: (plan: MealPlan) => void;
}) {
  const t = useTranslations('nutrition');
  const dayWord = t('daySelector');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traineeUid, setTraineeUid] = useState('');
  const [days, setDays] = useState<DraftDay[]>([emptyDraftDay(0, dayWord)]);
  const [winStart, setWinStart] = useState('');
  const [winEnd, setWinEnd] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totalCalories = days.reduce(
    (sum, d) => sum + d.meals.reduce((s, m) => s + (Number(m.calories) || 0), 0),
    0,
  );

  // ── Day ops ────────────────────────────────────────────────
  const addDay = () => setDays((prev) => [...prev, emptyDraftDay(prev.length, dayWord)]);
  const removeDay = (idx: number) => setDays((prev) => prev.filter((_, i) => i !== idx));
  const renameDay = (idx: number, val: string) =>
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, dayName: val } : d)));

  // ── Row ops ────────────────────────────────────────────────
  const addRow = (dayIdx: number, seed?: Partial<DraftRow>) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              meals: [
                ...d.meals,
                {
                  id: newRowId(d.meals.length),
                  mealType: 'breakfast',
                  description: '',
                  calories: '',
                  protein: '',
                  carbs: '',
                  fats: '',
                  source: 'manual',
                  ...seed,
                } as DraftRow,
              ],
            }
          : d,
      ),
    );

  const updateRow = (dayIdx: number, rowId: string, patch: Partial<DraftRow>) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, meals: d.meals.map((m) => (m.id === rowId ? { ...m, ...patch } : m)) }
          : d,
      ),
    );

  const removeRow = (dayIdx: number, rowId: string) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, meals: d.meals.filter((m) => m.id !== rowId) } : d,
      ),
    );

  // Prefill a NEW row from a saved meal (maps custom_meals.fat → fats).
  const addFromSaved = (dayIdx: number, savedMealId: string) => {
    const meal = savedMeals.find((m) => m.id === savedMealId);
    if (!meal) return;
    addRow(dayIdx, {
      description: meal.title,
      calories: meal.calories != null ? String(meal.calories) : '',
      protein: meal.macros?.protein != null ? String(meal.macros.protein) : '',
      carbs: meal.macros?.carbs != null ? String(meal.macros.carbs) : '',
      fats: meal.macros?.fat != null ? String(meal.macros.fat) : '',
      source: 'library',
      savedMealId: meal.id,
    });
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('يرجى تعبئة اسم الخطة.');
    if (!traineeUid) return setError('يرجى اختيار المتدرّبة المُسند إليها الخطة.');
    if (days.length === 0) return setError('يجب إضافة يوم واحد على الأقل.');
    if (days.some((d) => d.meals.length === 0))
      return setError('كل يوم يجب أن يحتوي على وجبة واحدة على الأقل.');
    if (days.some((d) => d.meals.some((m) => !m.description.trim())))
      return setError('كل وجبة يجب أن تحتوي على وصف.');

    const hasWindow = winStart && winEnd;
    if ((winStart && !winEnd) || (!winStart && winEnd))
      return setError('يرجى تحديد بداية ونهاية نافذة الأكل معاً.');

    const payloadDays: MealPlanDay[] = days.map((d) => ({
      dayName: d.dayName,
      meals: d.meals.map(draftToRow),
    }));
    const eatingWindow = hasWindow ? { start: winStart, end: winEnd } : null;

    setSaving(true);
    const res = await createMealPlan(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        days: payloadDays,
        eatingWindow,
      },
      traineeUid,
    );
    setSaving(false);

    if (!res.success || !res.id) return setError(res.error || 'فشل حفظ الخطة.');

    onCreated({
      id: res.id,
      coachUid: '',
      assignedTo: traineeUid,
      name: name.trim(),
      description: description.trim() || undefined,
      days: payloadDays,
      totalCalories,
      eatingWindow,
      createdAt: Date.now(),
    });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
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
            المتدرّبة <span className="text-red-500">*</span>
          </label>
          {trainees.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-3 text-xs font-bold">
              لا توجد متدرّبات مسندة لك. أضيفي متدرّبات أولاً من قسم المتدربين.
            </div>
          ) : (
            <select
              value={traineeUid}
              onChange={(e) => setTraineeUid(e.target.value)}
              disabled={saving}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold transition-colors bg-gray-50 focus:bg-white"
            >
              <option value="">— اختر المتدرّبة —</option>
              {trainees.map((tr) => (
                <option key={tr.uid} value={tr.uid}>
                  {tr.name} ({tr.email})
                </option>
              ))}
            </select>
          )}
        </div>

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

        {/* Eating window (optional, plan-level) */}
        <div className="bg-qwaam-pink-light/40 border border-qwaam-pink/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-qwaam-pink" />
            <span className="text-sm font-black text-text-main">{t('builder.eatingWindowTitle')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-text-muted mb-1">{t('builder.start')}</label>
              <input
                type="time"
                value={winStart}
                onChange={(e) => setWinStart(e.target.value)}
                disabled={saving}
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-text-muted mb-1">{t('builder.end')}</label>
              <input
                type="time"
                value={winEnd}
                onChange={(e) => setWinEnd(e.target.value)}
                disabled={saving}
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold bg-white"
              />
            </div>
          </div>
          <p className="text-[11px] font-bold text-text-muted">{t('builder.eatingWindowHint')}</p>
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
            disabled={saving}
            onRename={(val) => renameDay(dayIdx, val)}
            onRemove={() => removeDay(dayIdx)}
            onAddRow={() => addRow(dayIdx)}
            onAddFromSaved={(id) => addFromSaved(dayIdx, id)}
            onUpdateRow={(rowId, patch) => updateRow(dayIdx, rowId, patch)}
            onRemoveRow={(rowId) => removeRow(dayIdx, rowId)}
          />
        ))}

        <button
          type="button"
          onClick={addDay}
          disabled={saving}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-qwaam-pink/40 text-qwaam-pink font-black text-sm hover:bg-qwaam-pink-light/30 hover:border-qwaam-pink transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          {t('builder.addDay')}
        </button>
      </div>

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

// ── Day Card ──────────────────────────────────────────────────────────────────

function DayCard({
  day, dayIdx, savedMeals, canRemove, disabled,
  onRename, onRemove, onAddRow, onAddFromSaved, onUpdateRow, onRemoveRow,
}: {
  day: DraftDay;
  dayIdx: number;
  savedMeals: SavedMeal[];
  canRemove: boolean;
  disabled: boolean;
  onRename: (val: string) => void;
  onRemove: () => void;
  onAddRow: () => void;
  onAddFromSaved: (savedMealId: string) => void;
  onUpdateRow: (rowId: string, patch: Partial<DraftRow>) => void;
  onRemoveRow: (rowId: string) => void;
}) {
  const t = useTranslations('nutrition');
  const [prefillId, setPrefillId] = useState('');

  const dayCalories = day.meals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
  const macroInput =
    'w-full px-2 py-2 rounded-lg border-2 border-border-light focus:border-qwaam-pink outline-none text-center text-sm font-bold bg-white';

  const handlePrefill = (id: string) => {
    if (!id) return;
    onAddFromSaved(id);
    setPrefillId('');
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
            title={t('builder.removeDay')}
            className="p-2 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Meal rows */}
      {day.meals.length > 0 && (
        <ul className="space-y-3">
          {day.meals.map((m) => (
            <li key={m.id} className="bg-gray-50 rounded-2xl p-4 border border-border-light/50 space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={m.mealType}
                  onChange={(e) => onUpdateRow(m.id, { mealType: e.target.value as MealType })}
                  disabled={disabled}
                  className="px-3 py-2 rounded-lg bg-white border-2 border-border-light focus:border-qwaam-pink outline-none text-xs font-black shrink-0"
                >
                  {MEAL_TYPES.map((mt) => (
                    <option key={mt} value={mt}>
                      {MEAL_TYPE_ICON[mt]} {t(`mealType.${mt}`)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={m.description}
                  onChange={(e) => onUpdateRow(m.id, { description: e.target.value })}
                  disabled={disabled}
                  placeholder={t('builder.descriptionPlaceholder')}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={() => onRemoveRow(m.id)}
                  disabled={disabled}
                  title={t('builder.removeRow')}
                  className="p-1.5 rounded text-red-300 hover:text-red-600 transition-colors shrink-0"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <label className="block">
                  <span className="block text-[10px] font-black text-text-muted mb-1 text-center">{t('builder.calories')}</span>
                  <input type="number" min={0} dir="ltr" value={m.calories} disabled={disabled}
                    onChange={(e) => onUpdateRow(m.id, { calories: e.target.value })} className={macroInput} placeholder="0" />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-black text-red-500 mb-1 text-center">{t('builder.protein')}</span>
                  <input type="number" min={0} dir="ltr" value={m.protein} disabled={disabled}
                    onChange={(e) => onUpdateRow(m.id, { protein: e.target.value })} className={macroInput} placeholder="0" />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-black text-green-600 mb-1 text-center">{t('builder.carbs')}</span>
                  <input type="number" min={0} dir="ltr" value={m.carbs} disabled={disabled}
                    onChange={(e) => onUpdateRow(m.id, { carbs: e.target.value })} className={macroInput} placeholder="0" />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-black text-yellow-600 mb-1 text-center">{t('builder.fats')}</span>
                  <input type="number" min={0} dir="ltr" value={m.fats} disabled={disabled}
                    onChange={(e) => onUpdateRow(m.id, { fats: e.target.value })} className={macroInput} placeholder="0" />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add controls: manual + prefill from saved */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">
        <button
          type="button"
          onClick={onAddRow}
          disabled={disabled}
          className="px-4 py-2.5 rounded-xl bg-qwaam-pink text-white font-black text-xs hover:bg-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          {t('builder.addRow')}
        </button>
        {savedMeals.length > 0 && (
          <select
            value={prefillId}
            onChange={(e) => handlePrefill(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2.5 rounded-xl bg-white border-2 border-border-light focus:border-qwaam-pink outline-none text-xs font-bold truncate"
          >
            <option value="">{t('builder.prefillPlaceholder')}</option>
            {savedMeals.map((sm) => (
              <option key={sm.id} value={sm.id}>
                {sm.title} ({sm.calories ?? 0} kcal)
              </option>
            ))}
          </select>
        )}
      </div>
      {savedMeals.length > 0 && (
        <p className="text-[11px] font-bold text-text-muted">{t('builder.prefillHint')}</p>
      )}
    </div>
  );
}
