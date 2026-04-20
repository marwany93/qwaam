'use client';

import { useState, Fragment } from 'react';
import { Tab, Dialog, Transition } from '@headlessui/react';
import type { Exercise, Workout, Meal, TargetMuscle, Equipment, WeightLevel, MealType } from '@/types';
import {
  addExercise, deleteExercise,
  addWorkout, deleteWorkout,
  addMeal, deleteMeal,
} from '@/actions/library-actions';
import {
  PlusIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

// ── Shared Modal Shell ────────────────────────────────────────────────────────

function ModalShell({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto" dir="rtl">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl border border-border-light text-right">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-black text-text-main">{title}</Dialog.Title>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted hover:text-qwaam-pink transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold transition-colors bg-gray-50 focus:bg-white';
const selectCls = `${inputCls} bg-white`;
const labelCls = 'block text-xs font-black text-text-muted mb-1.5 uppercase tracking-wider';

// ── Add Exercise Modal ────────────────────────────────────────────────────────

const TARGET_MUSCLES: TargetMuscle[] = ['Chest', 'Back', 'Legs', 'Core', 'Arms', 'Shoulders', 'Glutes', 'Full Body'];
const EQUIPMENT_LIST: Equipment[] = ['Bodyweight', 'Dumbbell', 'Barbell', 'Machine', 'Cable', 'Resistance Band', 'Kettlebell'];
const WEIGHT_LEVELS: WeightLevel[] = ['bodyweight', 'light', 'medium', 'heavy', 'max'];
const WEIGHT_LEVEL_AR: Record<WeightLevel, string> = {
  bodyweight: 'وزن الجسم', light: 'خفيف', medium: 'متوسط', heavy: 'ثقيل', max: 'أقصى جهد'
};

function AddExerciseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', targetMuscle: 'Chest' as TargetMuscle,
    equipment: 'Bodyweight' as Equipment, videoUrl: '',
    defaultSets: 3, defaultReps: '10-12',
    defaultWeightLevel: 'medium' as WeightLevel, defaultRest: 60,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await addExercise({ ...form });
    if (res.error) { setError(res.error); } else {
      setForm({ nameAr: '', nameEn: '', targetMuscle: 'Chest', equipment: 'Bodyweight',
        videoUrl: '', defaultSets: 3, defaultReps: '10-12', defaultWeightLevel: 'medium', defaultRest: 60 });
      onClose();
    }
    setLoading(false);
  }

  return (
    <ModalShell open={open} onClose={onClose} title="➕ إضافة تمرين للمكتبة">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>اسم التمرين (عربي)</label>
            <input className={inputCls} required value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="مثال: ضغط الصدر بالدمبل" />
          </div>
          <div>
            <label className={labelCls}>Exercise Name (English)</label>
            <input className={inputCls} required dir="ltr" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="e.g. Dumbbell Chest Press" />
          </div>
          <div>
            <label className={labelCls}>العضلة المستهدفة</label>
            <select className={selectCls} value={form.targetMuscle} onChange={e => set('targetMuscle', e.target.value)}>
              {TARGET_MUSCLES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>المعدات المطلوبة</label>
            <select className={selectCls} value={form.equipment} onChange={e => set('equipment', e.target.value)}>
              {EQUIPMENT_LIST.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>عدد الجولات الافتراضي</label>
            <input className={inputCls} type="number" min={1} required value={form.defaultSets} onChange={e => set('defaultSets', +e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>نطاق التكرارات (مثال: 10-12)</label>
            <input className={inputCls} required dir="ltr" value={form.defaultReps} onChange={e => set('defaultReps', e.target.value)} placeholder="10-12" />
          </div>
          <div>
            <label className={labelCls}>مستوى الثقل الافتراضي</label>
            <select className={selectCls} value={form.defaultWeightLevel} onChange={e => set('defaultWeightLevel', e.target.value)}>
              {WEIGHT_LEVELS.map(w => <option key={w} value={w}>{WEIGHT_LEVEL_AR[w]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>وقت الراحة (ثانية)</label>
            <input className={inputCls} type="number" min={0} required value={form.defaultRest} onChange={e => set('defaultRest', +e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>رابط الفيديو (YouTube - اختياري)</label>
            <input className={inputCls} dir="ltr" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtube.com/shorts/..." />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-bold">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-qwaam-pink text-white font-black text-base shadow-lg shadow-qwaam-pink/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ التمرين في المكتبة'}
        </button>
      </form>
    </ModalShell>
  );
}

// ── Add Workout Modal ─────────────────────────────────────────────────────────

interface WorkoutExRow {
  exerciseId: string;
  sets: number | '';
  reps: string;
  weightLevel: WeightLevel;
  rest: number | '';
  notes: string;
}

function AddWorkoutModal({ open, onClose, exercises }: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<WorkoutExRow[]>([
    { exerciseId: '', sets: '', reps: '', weightLevel: 'medium', rest: '', notes: '' }
  ]);
  const [exSearch, setExSearch] = useState('');

  function addRow() {
    setRows(r => [...r, { exerciseId: '', sets: '', reps: '', weightLevel: 'medium', rest: '', notes: '' }]);
  }
  function removeRow(i: number) {
    setRows(r => r.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, k: keyof WorkoutExRow, v: any) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  }

  // When an exercise is picked, prefill its defaults
  function pickExercise(i: number, exId: string) {
    const ex = exercises.find(e => e.id === exId);
    setRows(r => r.map((row, idx) => idx === i ? {
      ...row,
      exerciseId: exId,
      sets: ex?.defaultSets ?? '',
      reps: ex?.defaultReps ?? '',
      weightLevel: ex?.defaultWeightLevel ?? 'medium',
      rest: ex?.defaultRest ?? '',
    } : row));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError('');
    const exercisesJson = JSON.stringify(rows.map(r => ({
      exerciseId: r.exerciseId,
      sets: r.sets ? Number(r.sets) : undefined,
      reps: r.reps || undefined,
      weightLevel: r.weightLevel,
      rest: r.rest ? Number(r.rest) : undefined,
      notes: r.notes || undefined,
    })));
    formData.set('exercisesJson', exercisesJson);
    const res = await addWorkout(formData);
    if (res.error) { setError(res.error); }
    else { setRows([{ exerciseId: '', sets: '', reps: '', weightLevel: 'medium', rest: '', notes: '' }]); onClose(); }
    setLoading(false);
  }

  const filteredExercises = exercises.filter(ex =>
    !exSearch || ex.nameAr.includes(exSearch) || ex.nameEn.toLowerCase().includes(exSearch.toLowerCase())
  );

  return (
    <ModalShell open={open} onClose={onClose} title="📋 بناء برنامج تدريبي">
      <form action={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-border-light">
          <div>
            <label className={labelCls}>اسم البرنامج (عربي)</label>
            <input name="titleAr" className={inputCls} required placeholder="مثال: يوم الصدر والكتف" disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>Program Name (English)</label>
            <input name="titleEn" className={inputCls} required dir="ltr" placeholder="e.g. Push Day A" disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>مستوى الصعوبة</label>
            <select name="difficulty" className={selectCls} disabled={loading}>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>المدة الكلية (دقيقة)</label>
            <input name="duration" type="number" min={1} className={inputCls} required placeholder="45" disabled={loading} />
          </div>
        </div>

        {/* Exercise Selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-black text-text-main">قائمة التمارين</h4>
            <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-sm font-bold text-qwaam-pink bg-qwaam-pink-light px-3 py-2 rounded-xl hover:bg-pink-100 transition-colors">
              <PlusIcon className="w-4 h-4" /> إضافة تمرين
            </button>
          </div>

          {/* Search exercises */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full pr-9 pl-4 py-2.5 rounded-xl border-2 border-border-light text-sm font-bold outline-none focus:border-qwaam-pink"
              placeholder="ابحث عن تمرين من المكتبة..."
              value={exSearch}
              onChange={e => setExSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-[36vh] overflow-y-auto pr-1">
            {rows.map((row, i) => {
              const picked = exercises.find(e => e.id === row.exerciseId);
              return (
                <div key={i} className="bg-white border-2 border-border-light rounded-2xl p-4 space-y-3 group hover:border-qwaam-pink/40 transition-colors relative">
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="absolute top-2 left-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <label className={labelCls}>التمرين من المكتبة</label>
                    <select
                      className={selectCls}
                      value={row.exerciseId}
                      onChange={e => pickExercise(i, e.target.value)}
                      required
                    >
                      <option value="">— اختر تمرين —</option>
                      {filteredExercises.map(ex => (
                        <option key={ex.id} value={ex.id}>
                          {ex.nameAr} ({ex.targetMuscle} · {ex.equipment})
                        </option>
                      ))}
                    </select>
                  </div>
                  {picked && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className={labelCls}>جولات</label>
                        <input className={inputCls} type="number" min={1} value={row.sets} onChange={e => updateRow(i, 'sets', e.target.value)} placeholder={String(picked.defaultSets)} />
                      </div>
                      <div>
                        <label className={labelCls}>تكرارات</label>
                        <input className={inputCls} dir="ltr" value={row.reps} onChange={e => updateRow(i, 'reps', e.target.value)} placeholder={picked.defaultReps} />
                      </div>
                      <div>
                        <label className={labelCls}>الثقل</label>
                        <select className={selectCls} value={row.weightLevel} onChange={e => updateRow(i, 'weightLevel', e.target.value as WeightLevel)}>
                          {WEIGHT_LEVELS.map(w => <option key={w} value={w}>{WEIGHT_LEVEL_AR[w]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>راحة (ث)</label>
                        <input className={inputCls} type="number" min={0} value={row.rest} onChange={e => updateRow(i, 'rest', e.target.value)} placeholder={String(picked.defaultRest)} />
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <label className={labelCls}>ملاحظات (اختياري)</label>
                        <input className={inputCls} value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} placeholder="تعليمات خاصة، رتم أداء..." />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-bold">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-text-main text-white font-black text-base shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ ونشر البرنامج'}
        </button>
      </form>
    </ModalShell>
  );
}

// ── Add Meal Modal ─────────────────────────────────────────────────────────────

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '🌅 إفطار' },
  { value: 'lunch',     label: '☀️ غداء' },
  { value: 'dinner',    label: '🌙 عشاء' },
  { value: 'snack',     label: '🍎 وجبة خفيفة' },
];

function AddMealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError('');
    const res = await addMeal(formData);
    if (res.error) { setError(res.error); } else { onClose(); }
    setLoading(false);
  }

  return (
    <ModalShell open={open} onClose={onClose} title="🥗 إضافة وجبة غذائية">
      <form action={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>اسم الوجبة (عربي)</label>
            <input name="nameAr" className={inputCls} required placeholder="مثال: صدر دجاج مشوي" disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>Meal Name (English)</label>
            <input name="nameEn" className={inputCls} required dir="ltr" placeholder="e.g. Grilled Chicken Breast" disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>نوع الوجبة</label>
            <select name="type" className={selectCls} required disabled={loading}>
              {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>السعرات الحرارية (kcal)</label>
            <input name="calories" type="number" min={1} className={inputCls} required placeholder="350" disabled={loading} />
          </div>
        </div>

        {/* Macros */}
        <div className="bg-gray-50 border border-border-light rounded-2xl p-4">
          <h5 className="font-black text-text-main mb-3 text-sm">الماكروز (جرام)</h5>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-red-500 mb-1.5 uppercase tracking-wider">بروتين</label>
              <input name="protein" type="number" min={0} className={inputCls} required placeholder="30" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-black text-green-600 mb-1.5 uppercase tracking-wider">كارب</label>
              <input name="carbs" type="number" min={0} className={inputCls} required placeholder="40" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-black text-yellow-600 mb-1.5 uppercase tracking-wider">دهون</label>
              <input name="fats" type="number" min={0} className={inputCls} required placeholder="10" disabled={loading} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>الوصفة / المكونات (اختياري)</label>
          <textarea name="recipe" rows={3} className={`${inputCls} resize-none`} placeholder="المكونات وطريقة التحضير..." disabled={loading} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-bold">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-qwaam-yellow text-text-main font-black text-base shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ الوجبة في المكتبة'}
        </button>
      </form>
    </ModalShell>
  );
}

// ── Tab button factory ────────────────────────────────────────────────────────

function tabCls(selected: boolean, color: 'pink' | 'dark' | 'yellow') {
  const base = 'flex-1 sm:flex-none sm:w-52 rounded-xl py-3.5 text-sm font-extrabold leading-5 outline-none transition-all';
  if (!selected) return `${base} text-text-muted hover:bg-gray-50 hover:text-text-main`;
  const active = {
    pink:   'bg-qwaam-pink-light text-qwaam-pink shadow-sm ring-1 ring-qwaam-pink/20',
    dark:   'bg-text-main/5 text-text-main shadow-sm ring-1 ring-text-main/10',
    yellow: 'bg-qwaam-yellow/20 text-yellow-700 shadow-sm ring-1 ring-qwaam-yellow/50',
  };
  return `${base} ${active[color]}`;
}

// ── Main LibraryContent ───────────────────────────────────────────────────────

export default function LibraryContent({
  exercises, workouts, meals,
}: {
  exercises: Exercise[];
  workouts: Workout[];
  meals: Meal[];
}) {
  const [exModal, setExModal]   = useState(false);
  const [wkModal, setWkModal]   = useState(false);
  const [mlModal, setMlModal]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteExercise(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا التمرين؟')) return;
    setDeletingId(id);
    await deleteExercise(id);
    setDeletingId(null);
  }
  async function handleDeleteWorkout(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا البرنامج؟')) return;
    setDeletingId(id);
    await deleteWorkout(id);
    setDeletingId(null);
  }
  async function handleDeleteMeal(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الوجبة؟')) return;
    setDeletingId(id);
    await deleteMeal(id);
    setDeletingId(null);
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-text-main tracking-tight">مكتبة المحتوى</h1>
        <p className="text-text-muted font-bold text-lg mt-1">إدارة التمارين، البرامج التدريبية، والوجبات الغذائية</p>
      </div>

      <Tab.Group>
        {/* Tab Nav */}
        <div className="bg-white p-2 rounded-2xl border border-border-light shadow-sm sticky top-0 z-10">
          <Tab.List className="flex gap-1">
            <Tab className={({ selected }) => tabCls(selected, 'pink')}>🏋️‍♀️ التمارين</Tab>
            <Tab className={({ selected }) => tabCls(selected, 'dark')}>📋 الجداول التدريبية</Tab>
            <Tab className={({ selected }) => tabCls(selected, 'yellow')}>🥗 الوجبات</Tab>
          </Tab.List>
        </div>

        <Tab.Panels className="mt-4">

          {/* ── Exercises Tab ── */}
          <Tab.Panel className="outline-none space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setExModal(true)} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-qwaam-pink text-white shadow-md shadow-qwaam-pink/25 hover:-translate-y-0.5 transition-all">
                <PlusIcon className="w-5 h-5" /> إضافة تمرين
              </button>
            </div>

            {exercises.length === 0 ? (
              <EmptyState icon="🏋️‍♀️" title="مكتبة التمارين فارغة" desc="أضف التمارين الأساسية لتتمكن من بناء البرامج." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exercises.map(ex => (
                  <div key={ex.id} className="group bg-white rounded-2xl border-2 border-border-light p-5 hover:border-qwaam-pink/40 hover:shadow-md transition-all relative flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-text-main text-lg leading-tight">{ex.nameAr}</h4>
                        <p className="text-xs font-bold text-text-muted" dir="ltr">{ex.nameEn}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteExercise(ex.id)}
                        disabled={deletingId === ex.id}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0 p-1"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-qwaam-pink-light text-qwaam-pink text-[11px] font-black px-2.5 py-1 rounded-full">{ex.targetMuscle}</span>
                      <span className="bg-gray-100 text-gray-600 text-[11px] font-black px-2.5 py-1 rounded-full">{ex.equipment}</span>
                    </div>
                    {/* Defaults */}
                    <div className="grid grid-cols-3 gap-2 text-center mt-auto">
                      <StatChip label="جولات" value={String(ex.defaultSets)} />
                      <StatChip label="تكرارات" value={ex.defaultReps} ltr />
                      <StatChip label="راحة" value={`${ex.defaultRest}ث`} ltr />
                    </div>
                    {ex.videoUrl && (
                      <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold text-qwaam-pink underline underline-offset-2 hover:text-pink-600 transition-colors">
                        ▶ شاهد الشرح
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* ── Workouts Tab ── */}
          <Tab.Panel className="outline-none space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setWkModal(true)} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-text-main text-white shadow-md hover:-translate-y-0.5 transition-all">
                <PlusIcon className="w-5 h-5" /> بناء برنامج جديد
              </button>
            </div>

            {workouts.length === 0 ? (
              <EmptyState icon="📋" title="لا توجد برامج تدريبية بعد" desc="ابدأ ببناء البرامج من مكتبة التمارين." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {workouts.map(w => (
                  <div key={w.id} className="group bg-white rounded-2xl border-2 border-border-light p-6 hover:border-qwaam-pink/40 hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-text-main opacity-10 group-hover:opacity-30 transition-opacity" />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-text-main text-xl leading-tight">{w.titleAr}</h4>
                        <p className="text-xs font-bold text-text-muted mt-0.5" dir="ltr">{w.titleEn}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-qwaam-pink-light text-qwaam-pink text-[11px] font-black px-2.5 py-1 rounded-full">{w.difficulty}</span>
                        <button onClick={() => handleDeleteWorkout(w.id)} disabled={deletingId === w.id}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                      <StatChip label="مدة" value={`${w.duration} د`} />
                      <StatChip label="تمارين" value={String(w.exercises?.length ?? 0).padStart(2, '0')} ltr />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* ── Meals Tab ── */}
          <Tab.Panel className="outline-none space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setMlModal(true)} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-qwaam-yellow text-text-main shadow-md hover:-translate-y-0.5 transition-all">
                <PlusIcon className="w-5 h-5" /> إضافة وجبة
              </button>
            </div>

            {meals.length === 0 ? (
              <EmptyState icon="🥗" title="قاعدة الوجبات فارغة" desc="أضف وجبات جاهزة لبناء الخطط الغذائية بسرعة." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {meals.map(m => {
                  const mealTypeLabel = MEAL_TYPES.find(t => t.value === m.type)?.label ?? '';
                  return (
                    <div key={m.id} className="group bg-white rounded-2xl border-2 border-border-light p-6 hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-qwaam-yellow opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-yellow-600 mb-1 block">{mealTypeLabel}</span>
                          <h4 className="font-black text-text-main text-xl leading-tight">{m.nameAr}</h4>
                          <p className="text-xs font-bold text-text-muted mt-0.5" dir="ltr">{m.nameEn}</p>
                        </div>
                        <button onClick={() => handleDeleteMeal(m.id)} disabled={deletingId === m.id}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 shrink-0">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between border border-border-light/50">
                        <span className="text-xs font-black text-text-muted uppercase tracking-widest">السعرات</span>
                        <span className="font-black text-2xl text-text-main">{m.calories}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <MacroPill label="بروتين" value={m.macros.protein} color="red" />
                        <MacroPill label="كارب" value={m.macros.carbs} color="green" />
                        <MacroPill label="دهون" value={m.macros.fats} color="yellow" />
                      </div>
                      {m.recipe && (
                        <p className="text-xs font-bold text-text-muted leading-relaxed line-clamp-2 border-t border-border-light/50 pt-3">{m.recipe}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Tab.Panel>

        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <AddExerciseModal open={exModal} onClose={() => setExModal(false)} />
      <AddWorkoutModal  open={wkModal} onClose={() => setWkModal(false)} exercises={exercises} />
      <AddMealModal     open={mlModal} onClose={() => setMlModal(false)} />
    </div>
  );
}

// ── Micro-components ──────────────────────────────────────────────────────────

function StatChip({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="bg-gray-50 border border-border-light/50 rounded-xl py-2 flex flex-col items-center gap-0.5 flex-1">
      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</span>
      <span className="font-black text-sm text-text-main" dir={ltr ? 'ltr' : undefined}>{value}</span>
    </div>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: 'red' | 'green' | 'yellow' }) {
  const cls = {
    red:    'text-red-700 bg-red-50',
    green:  'text-green-700 bg-green-50',
    yellow: 'text-yellow-700 bg-yellow-50',
  }[color];
  return (
    <div className={`${cls} rounded-xl py-2 flex flex-col items-center gap-0.5`}>
      <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</span>
      <span className="font-black text-sm">{value}g</span>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="py-24 px-6 text-center text-text-muted flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-border-light shadow-sm">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
        <span className="text-5xl block grayscale opacity-50">{icon}</span>
      </div>
      <h3 className="text-2xl font-black text-text-main mb-3">{title}</h3>
      <p className="text-base max-w-sm font-medium">{desc}</p>
    </div>
  );
}
