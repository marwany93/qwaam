'use client';

import { useState, Fragment } from 'react';
import { useLocale } from 'next-intl';
import { Tab, Dialog, Transition } from '@headlessui/react';
import type { Exercise, Workout, TargetMuscle, Equipment, WeightLevel } from '@/types';
import {
  addExercise,    updateExercise, deleteExercise,
  addWorkout,     updateWorkout,  deleteWorkout,
} from '@/actions/library-actions';
import {
  PlusIcon, TrashIcon, XMarkIcon, PencilIcon,
} from '@heroicons/react/24/outline';
import MealsManager from '@/components/admin/library/MealsManager';
import ExerciseBrowser from '@/components/admin/library/ExerciseBrowser';
import {
  MUSCLE_FORM_OPTIONS,
  EQUIPMENT_LIST,
  muscleLabel,
  equipmentLabel,
} from '@/lib/exercise-taxonomy';

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

// ── Constants ─────────────────────────────────────────────────────────────────

// Muscle + equipment lists come from the shared taxonomy (src/lib/exercise-taxonomy.ts).
// The form offers MUSCLE_FORM_OPTIONS (canonical set, no legacy Legs/Arms).
const WEIGHT_LEVELS: WeightLevel[]   = ['bodyweight', 'light', 'medium', 'heavy', 'max'];
const WEIGHT_LEVEL_AR: Record<WeightLevel, string> = {
  bodyweight: 'وزن الجسم', light: 'خفيف', medium: 'متوسط', heavy: 'ثقيل', max: 'أقصى جهد',
};

// ── Exercise Form (shared by Add + Edit modals) ───────────────────────────────

type ExerciseFormState = {
  nameAr: string; nameEn: string; targetMuscle: TargetMuscle;
  equipment: Equipment; videoUrl: string;
  defaultSets: number; defaultReps: string;
  defaultWeightLevel: WeightLevel; defaultRest: number;
};

const EMPTY_EXERCISE_FORM: ExerciseFormState = {
  nameAr: '', nameEn: '', targetMuscle: 'Chest', equipment: 'Bodyweight',
  videoUrl: '', defaultSets: 3, defaultReps: '10-12', defaultWeightLevel: 'medium', defaultRest: 60,
};

function ExerciseForm({
  initial, onSubmit, loading, error, submitLabel,
}: {
  initial: ExerciseFormState;
  onSubmit: (form: ExerciseFormState) => void;
  loading: boolean;
  error: string;
  submitLabel: string;
}) {
  const [form, setForm] = useState<ExerciseFormState>(initial);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const locale = useLocale();

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>اسم التمرين (عربي)</label>
          <input className={inputCls} required value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="ضغط الصدر بالدمبل" />
        </div>
        <div>
          <label className={labelCls}>Exercise Name (English)</label>
          <input className={inputCls} required dir="ltr" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="Dumbbell Chest Press" />
        </div>
        <div>
          <label className={labelCls}>العضلة المستهدفة</label>
          <select className={selectCls} value={form.targetMuscle} onChange={e => set('targetMuscle', e.target.value)}>
            {MUSCLE_FORM_OPTIONS.map(m => <option key={m} value={m}>{muscleLabel(m, locale)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>المعدات المطلوبة</label>
          <select className={selectCls} value={form.equipment} onChange={e => set('equipment', e.target.value)}>
            {EQUIPMENT_LIST.map(eq => <option key={eq} value={eq}>{equipmentLabel(eq, locale)}</option>)}
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
        {loading ? 'جاري الحفظ...' : submitLabel}
      </button>
    </form>
  );
}

// ── Add Exercise Modal ────────────────────────────────────────────────────────

function AddExerciseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(form: ExerciseFormState) {
    setLoading(true); setError('');
    const res = await addExercise({ ...form });
    if (res.error) { setError(res.error); } else { onClose(); }
    setLoading(false);
  }

  return (
    <ModalShell open={open} onClose={onClose} title="➕ إضافة تمرين للمكتبة">
      <ExerciseForm
        initial={EMPTY_EXERCISE_FORM}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        submitLabel="حفظ التمرين في المكتبة"
      />
    </ModalShell>
  );
}

// ── Edit Exercise Modal ───────────────────────────────────────────────────────

function EditExerciseModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(form: ExerciseFormState) {
    setLoading(true); setError('');
    const res = await updateExercise(exercise.id, { ...form });
    if (res.error) { setError(res.error); } else { onClose(); }
    setLoading(false);
  }

  const initial: ExerciseFormState = {
    nameAr:             exercise.nameAr,
    nameEn:             exercise.nameEn,
    targetMuscle:       exercise.targetMuscle,
    equipment:          exercise.equipment,
    videoUrl:           exercise.videoUrl ?? '',
    defaultSets:        exercise.defaultSets,
    defaultReps:        exercise.defaultReps,
    defaultWeightLevel: exercise.defaultWeightLevel,
    defaultRest:        exercise.defaultRest,
  };

  return (
    <ModalShell open={true} onClose={onClose} title={`✏️ تعديل: ${exercise.nameAr}`}>
      <ExerciseForm
        initial={initial}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        submitLabel="حفظ التعديلات"
      />
    </ModalShell>
  );
}

// ── Add Workout Modal ─────────────────────────────────────────────────────────

interface WorkoutExRow {
  exerciseId: string; sets: number | ''; reps: string;
  weightLevel: WeightLevel; rest: number | ''; notes: string;
}

function AddWorkoutModal({ open, onClose, exercises }: {
  open: boolean; onClose: () => void; exercises: Exercise[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // One row per selected exercise (no duplicates). The muscle-grouped browser
  // toggles membership; overrides are edited in the selected-list below.
  const [rows, setRows] = useState<WorkoutExRow[]>([]);

  function removeRow(exerciseId: string) {
    setRows(r => r.filter(row => row.exerciseId !== exerciseId));
  }
  function updateRow(exerciseId: string, k: keyof WorkoutExRow, v: any) {
    setRows(r => r.map(row => row.exerciseId === exerciseId ? { ...row, [k]: v } : row));
  }
  function toggleExercise(ex: Exercise) {
    setRows(prev => {
      if (prev.some(r => r.exerciseId === ex.id)) {
        return prev.filter(r => r.exerciseId !== ex.id);
      }
      return [...prev, {
        exerciseId: ex.id,
        sets: ex.defaultSets ?? '',
        reps: ex.defaultReps ?? '',
        weightLevel: ex.defaultWeightLevel ?? 'medium',
        rest: ex.defaultRest ?? '',
        notes: '',
      }];
    });
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
    else { setRows([]); onClose(); }
    setLoading(false);
  }

  const selectedIds = new Set(rows.map(r => r.exerciseId));

  return (
    <ModalShell open={open} onClose={onClose} title="📋 بناء برنامج تدريبي">
      <form action={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-border-light">
          <div>
            <label className={labelCls}>اسم البرنامج (عربي)</label>
            <input name="titleAr" className={inputCls} required placeholder="يوم الصدر والكتف" disabled={loading} />
          </div>
          <div>
            <label className={labelCls}>Program Name (English)</label>
            <input name="titleEn" className={inputCls} required dir="ltr" placeholder="Push Day A" disabled={loading} />
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

        <div className="space-y-4">
          <h4 className="font-black text-text-main">قائمة التمارين</h4>

          {/* Muscle-grouped picker — click an exercise to add/remove it */}
          <div className="max-h-[42vh] overflow-y-auto pr-1 border border-border-light rounded-2xl p-3 bg-gray-50/50">
            <ExerciseBrowser
              exercises={exercises}
              mode="select"
              selectedIds={selectedIds}
              onToggle={toggleExercise}
            />
          </div>

          {/* Selected exercises + per-exercise overrides */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-text-muted uppercase tracking-wider">
                التمارين المختارة ({rows.length})
              </p>
              {rows.map((row) => {
                const picked = exercises.find(e => e.id === row.exerciseId);
                if (!picked) return null;
                return (
                  <div key={row.exerciseId} className="bg-white border-2 border-border-light rounded-2xl p-4 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => removeRow(row.exerciseId)}
                      className="absolute top-2 left-2 text-red-400 hover:text-red-600 transition-colors"
                      title="إزالة"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="font-black text-text-main text-sm leading-tight">{picked.nameAr}</p>
                      <p className="text-[11px] font-bold text-text-muted" dir="ltr">{picked.nameEn}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className={labelCls}>جولات</label>
                        <input className={inputCls} type="number" min={1} value={row.sets} onChange={e => updateRow(row.exerciseId, 'sets', e.target.value)} placeholder={String(picked.defaultSets)} />
                      </div>
                      <div>
                        <label className={labelCls}>تكرارات</label>
                        <input className={inputCls} dir="ltr" value={row.reps} onChange={e => updateRow(row.exerciseId, 'reps', e.target.value)} placeholder={picked.defaultReps} />
                      </div>
                      <div>
                        <label className={labelCls}>الثقل</label>
                        <select className={selectCls} value={row.weightLevel} onChange={e => updateRow(row.exerciseId, 'weightLevel', e.target.value as WeightLevel)}>
                          {WEIGHT_LEVELS.map(w => <option key={w} value={w}>{WEIGHT_LEVEL_AR[w]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>راحة (ث)</label>
                        <input className={inputCls} type="number" min={0} value={row.rest} onChange={e => updateRow(row.exerciseId, 'rest', e.target.value)} placeholder={String(picked.defaultRest)} />
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <label className={labelCls}>ملاحظات (اختياري)</label>
                        <input className={inputCls} value={row.notes} onChange={e => updateRow(row.exerciseId, 'notes', e.target.value)} placeholder="تعليمات خاصة..." />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-bold">{error}</p>}
        <button type="submit" disabled={loading || rows.length === 0} className="w-full py-4 rounded-xl bg-text-main text-white font-black text-base shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'جاري الحفظ...' : 'حفظ ونشر البرنامج'}
        </button>
      </form>
    </ModalShell>
  );
}

// ── Edit Workout Modal (metadata only) ────────────────────────────────────────

function EditWorkoutModal({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titleAr:    workout.titleAr,
    titleEn:    workout.titleEn,
    difficulty: workout.difficulty,
    duration:   workout.duration,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await updateWorkout(workout.id, { ...form, duration: Number(form.duration) });
    if (res.error) { setError(res.error); } else { onClose(); }
    setLoading(false);
  }

  return (
    <ModalShell open={true} onClose={onClose} title={`✏️ تعديل: ${workout.titleAr}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>اسم البرنامج (عربي)</label>
            <input className={inputCls} required value={form.titleAr} onChange={e => set('titleAr', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Program Name (English)</label>
            <input className={inputCls} required dir="ltr" value={form.titleEn} onChange={e => set('titleEn', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>مستوى الصعوبة</label>
            <select className={selectCls} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>المدة الكلية (دقيقة)</label>
            <input className={inputCls} type="number" min={1} required value={form.duration} onChange={e => set('duration', e.target.value)} />
          </div>
        </div>
        <p className="text-xs font-bold text-text-muted bg-gray-50 p-3 rounded-xl border border-border-light">
          ℹ️ لتعديل قائمة التمارين داخل البرنامج، احذف البرنامج وأعد بناءه من المكتبة.
        </p>
        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-bold">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-text-main text-white font-black text-base shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>
    </ModalShell>
  );
}

// ── Add Meal Modal ────────────────────────────────────────────────────────────

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

export default function LibraryContent({ exercises, workouts }: {
  exercises: Exercise[]; workouts: Workout[];
}) {
  // Add modals
  const [exModal, setExModal] = useState(false);
  const [wkModal, setWkModal] = useState(false);

  // Edit modals — null means closed
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingWorkout,  setEditingWorkout]  = useState<Workout  | null>(null);

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">

      <div>
        <h1 className="text-4xl font-black text-text-main tracking-tight">مكتبة المحتوى</h1>
        <p className="text-text-muted font-bold text-lg mt-1">إدارة التمارين، البرامج التدريبية، والوجبات الغذائية</p>
      </div>

      <Tab.Group>
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
              <ExerciseBrowser
                exercises={exercises}
                mode="view"
                onEdit={setEditingExercise}
                onDelete={handleDeleteExercise}
                deletingId={deletingId}
              />
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
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="bg-qwaam-pink-light text-qwaam-pink text-[11px] font-black px-2.5 py-1 rounded-full">{w.difficulty}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => setEditingWorkout(w)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-qwaam-pink hover:bg-qwaam-pink-light transition-colors"
                            title="تعديل"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkout(w.id)}
                            disabled={deletingId === w.id}
                            className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="حذف"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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

          {/* ── Meals Tab — delegated to MealsManager (Spoonacular search + saved meals + planner) ── */}
          <Tab.Panel className="outline-none">
            <MealsManager />
          </Tab.Panel>

        </Tab.Panels>
      </Tab.Group>

      {/* ── Add Modals ── */}
      <AddExerciseModal open={exModal} onClose={() => setExModal(false)} />
      <AddWorkoutModal  open={wkModal} onClose={() => setWkModal(false)} exercises={exercises} />

      {/* ── Edit Modals — rendered conditionally so they mount with fresh state ── */}
      {editingExercise && (
        <EditExerciseModal exercise={editingExercise} onClose={() => setEditingExercise(null)} />
      )}
      {editingWorkout && (
        <EditWorkoutModal workout={editingWorkout} onClose={() => setEditingWorkout(null)} />
      )}
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

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="py-24 px-6 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-border-light shadow-sm">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
        <span className="text-5xl block grayscale opacity-50">{icon}</span>
      </div>
      <h3 className="text-2xl font-black text-text-main mb-3">{title}</h3>
      <p className="text-base max-w-sm font-medium">{desc}</p>
    </div>
  );
}
