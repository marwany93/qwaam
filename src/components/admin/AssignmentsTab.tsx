'use client';

import { Fragment, useState, useTransition } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Workout, Meal } from '@/types';
import {
  assignWorkout,
  assignMeal,
  removeAssignedWorkout,
  removeAssignedMeal,
} from '@/actions/assignment-actions';
import {
  XMarkIcon,
  PlusCircleIcon,
  TrashIcon,
  BookOpenIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Props {
  traineeUid: string;
  assignedWorkouts: Workout[];
  assignedMeals: Meal[];
  allWorkouts: Workout[];
  allMeals: Meal[];
}

// Maps difficulty keys → localized Arabic label + Tailwind color class
const difficultyConfig: Record<string, { label: string; class: string }> = {
  beginner:     { label: 'مبتدئ', class: 'bg-green-50 text-green-700 border-green-100' },
  intermediate: { label: 'متوسط', class: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  advanced:     { label: 'متقدم', class: 'bg-red-50 text-red-600 border-red-100' },
};

// Maps meal type keys → localized Arabic label + emoji + Tailwind color class
const mealTypeConfig: Record<string, { label: string; icon: string; class: string }> = {
  breakfast: { label: 'إفطار',        icon: '🌅', class: 'bg-orange-50 text-orange-600 border-orange-100' },
  lunch:     { label: 'غداء',         icon: '☀️', class: 'bg-amber-50 text-amber-700 border-amber-100' },
  dinner:    { label: 'عشاء',         icon: '🌙', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  snack:     { label: 'وجبة خفيفة',  icon: '🍎', class: 'bg-green-50 text-green-600 border-green-100' },
};

export default function AssignmentsTab({
  traineeUid,
  assignedWorkouts,
  assignedMeals,
  allWorkouts,
  allMeals,
}: Props) {
  const [dialogType, setDialogType] = useState<'workout' | 'meal' | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tracks which specific item ID triggered the current transition so we can
  // render a per-row spinner instead of disabling the entire list.
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const assignedWorkoutIds = new Set(assignedWorkouts.map((w) => w.id));
  const assignedMealIds    = new Set(assignedMeals.map((m) => m.id));

  const availableWorkouts = allWorkouts.filter((w) => !assignedWorkoutIds.has(w.id));
  const availableMeals    = allMeals.filter((m) => !assignedMealIds.has(m.id));

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleAssignWorkout(workoutId: string) {
    setPendingItemId(workoutId);
    startTransition(async () => {
      await assignWorkout(traineeUid, workoutId);
      setDialogType(null);
      setPendingItemId(null);
    });
  }

  function handleRemoveWorkout(workoutId: string) {
    setPendingItemId(workoutId);
    startTransition(async () => {
      await removeAssignedWorkout(traineeUid, workoutId);
      setPendingItemId(null);
    });
  }

  function handleAssignMeal(mealId: string) {
    setPendingItemId(mealId);
    startTransition(async () => {
      await assignMeal(traineeUid, mealId);
      setDialogType(null);
      setPendingItemId(null);
    });
  }

  function handleRemoveMeal(mealId: string) {
    setPendingItemId(mealId);
    startTransition(async () => {
      await removeAssignedMeal(traineeUid, mealId);
      setPendingItemId(null);
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Workouts Section ─────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex justify-between items-center" dir="rtl">
          <div>
            <h3 className="text-xl font-extrabold text-text-main">البرامج التدريبية المعينة</h3>
            <p className="text-text-muted text-sm font-bold mt-0.5">
              {assignedWorkouts.length === 0
                ? 'لا توجد برامج معينة بعد'
                : `${assignedWorkouts.length} برنامج معين حالياً`}
            </p>
          </div>

          {/* Count badge shows how many library items are still available to assign */}
          <button
            onClick={() => setDialogType('workout')}
            disabled={isPending || availableWorkouts.length === 0}
            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-text-main text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
          >
            <PlusCircleIcon className="w-5 h-5" />
            تعيين برنامج
            {availableWorkouts.length > 0 && (
              <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-qwaam-pink text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {availableWorkouts.length}
              </span>
            )}
          </button>
        </div>

        {assignedWorkouts.length === 0 ? (
          <EmptyState icon="🏋️‍♂️" msg="لا توجد برامج معينة لهذا المتدرب بعد. اضغط «تعيين برنامج» للبدء." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
            {assignedWorkouts.map((w) => {
              const diff = difficultyConfig[w.difficulty];
              const isThisItemPending = pendingItemId === w.id && isPending;

              return (
                <div
                  key={w.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm flex justify-between items-start gap-4 group transition-all duration-200 ${
                    isThisItemPending
                      ? 'border-qwaam-pink/30 opacity-60 scale-[0.99]'
                      : 'border-border-light hover:border-qwaam-pink/20'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-lg border mb-2 ${diff?.class ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                      {diff?.label ?? w.difficulty}
                    </span>
                    <h4 className="font-extrabold text-text-main text-base truncate">{w.titleAr}</h4>
                    <p className="text-text-muted text-xs font-bold mt-1">
                      ⏱ {w.duration} دقيقة &nbsp;·&nbsp; {w.exercises?.length || 0} حركة
                    </p>
                  </div>

                  {/* Remove button — only visible on hover; shows spinner when this row is pending */}
                  <button
                    onClick={() => handleRemoveWorkout(w.id)}
                    disabled={isPending}
                    title="إزالة البرنامج"
                    className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all disabled:cursor-not-allowed"
                  >
                    {isThisItemPending
                      ? <ArrowPathIcon className="w-5 h-5 animate-spin text-qwaam-pink" />
                      : <TrashIcon className="w-5 h-5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="border-t border-border-light" />

      {/* ── Meals Section ────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex justify-between items-center" dir="rtl">
          <div>
            <h3 className="text-xl font-extrabold text-text-main">الوجبات الغذائية المعينة</h3>
            <p className="text-text-muted text-sm font-bold mt-0.5">
              {assignedMeals.length === 0
                ? 'لا توجد وجبات معينة بعد'
                : `${assignedMeals.length} وجبة معينة حالياً`}
            </p>
          </div>

          <button
            onClick={() => setDialogType('meal')}
            disabled={isPending || availableMeals.length === 0}
            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-border-light text-text-main shadow-sm hover:border-qwaam-yellow hover:bg-yellow-50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
          >
            <PlusCircleIcon className="w-5 h-5 text-yellow-500" />
            تعيين وجبة
            {availableMeals.length > 0 && (
              <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-yellow-400 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {availableMeals.length}
              </span>
            )}
          </button>
        </div>

        {assignedMeals.length === 0 ? (
          <EmptyState icon="🥗" msg="لا توجد وجبات معينة لهذا المتدرب بعد. اضغط «تعيين وجبة» للبدء." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
            {assignedMeals.map((m) => {
              const mealType = mealTypeConfig[m.type] ?? { label: m.type, icon: '🍽️', class: 'bg-gray-50 text-gray-600 border-gray-100' };
              const isThisItemPending = pendingItemId === m.id && isPending;

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm flex justify-between items-start gap-4 group transition-all duration-200 ${
                    isThisItemPending
                      ? 'border-yellow-300/50 opacity-60 scale-[0.99]'
                      : 'border-border-light hover:border-yellow-300/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {/* Meal type badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg border mb-2 ${mealType.class}`}>
                      {mealType.icon} {mealType.label}
                    </span>
                    <h4 className="font-extrabold text-text-main text-base truncate">{m.nameAr}</h4>
                    {/* Macro pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="bg-gray-100 text-text-main px-2 py-0.5 rounded-lg text-[11px] font-black">🔥 {m.calories} سعرة</span>
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-[11px] font-black">P {m.macros.protein}g</span>
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg text-[11px] font-black">C {m.macros.carbs}g</span>
                      <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg text-[11px] font-black">F {m.macros.fats}g</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveMeal(m.id)}
                    disabled={isPending}
                    title="إزالة الوجبة"
                    className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all disabled:cursor-not-allowed"
                  >
                    {isThisItemPending
                      ? <ArrowPathIcon className="w-5 h-5 animate-spin text-yellow-500" />
                      : <TrashIcon className="w-5 h-5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Library Picker Dialog ────────────────────────────────────────────── */}
      <Transition appear show={dialogType !== null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          // Prevent accidental close while a Server Action is in flight
          onClose={() => !isPending && setDialogType(null)}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-text-main/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto" dir="rtl">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg bg-qwaam-white rounded-3xl shadow-2xl border border-border-light overflow-hidden">

                  {/* Dialog Header */}
                  <div className="flex justify-between items-center px-7 py-5 border-b border-border-light">
                    <Dialog.Title as="h3" className="text-xl font-extrabold text-text-main flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-qwaam-pink-light text-qwaam-pink border border-qwaam-pink/20 shrink-0">
                        <BookOpenIcon className="w-5 h-5" />
                      </span>
                      {dialogType === 'workout' ? 'اختر برنامجاً تدريبياً' : 'اختر وجبة غذائية'}
                    </Dialog.Title>
                    <button
                      onClick={() => setDialogType(null)}
                      disabled={isPending}
                      className="p-2 rounded-xl text-text-muted hover:text-qwaam-pink hover:bg-qwaam-pink-light transition-colors disabled:opacity-40"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Available count sub-header */}
                  <div className="px-7 pt-4 pb-1">
                    <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                      {dialogType === 'workout'
                        ? `${availableWorkouts.length} برنامج متاح للتعيين`
                        : `${availableMeals.length} وجبة متاحة للتعيين`}
                    </p>
                  </div>

                  {/* Scrollable item list */}
                  <div className="px-5 pb-6 pt-3 space-y-2.5 max-h-[430px] overflow-y-auto">

                    {/* ── Workout Picker Items ── */}
                    {dialogType === 'workout' && availableWorkouts.map((w) => {
                      const diff = difficultyConfig[w.difficulty];
                      const isThisItemPending = pendingItemId === w.id && isPending;
                      return (
                        <button
                          key={w.id}
                          onClick={() => handleAssignWorkout(w.id)}
                          disabled={isPending}
                          className="relative w-full text-right p-4 rounded-2xl border-2 border-border-light hover:border-qwaam-pink hover:bg-qwaam-pink-light/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                        >
                          {/* Per-item spinner overlay while this specific item is being assigned */}
                          {isThisItemPending && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
                              <ArrowPathIcon className="w-6 h-6 animate-spin text-qwaam-pink" />
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-text-main text-base truncate group-hover:text-qwaam-pink transition-colors">
                                {w.titleAr}
                              </h4>
                              <p className="text-text-muted text-xs font-bold mt-0.5">
                                {w.duration} دقيقة &nbsp;·&nbsp; {w.exercises?.length || 0} حركة
                              </p>
                            </div>
                            <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-lg border ${diff?.class ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                              {diff?.label ?? w.difficulty}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* ── Meal Picker Items ── */}
                    {dialogType === 'meal' && availableMeals.map((m) => {
                      const mealType = mealTypeConfig[m.type] ?? { label: m.type, icon: '🍽️', class: 'bg-gray-50 text-gray-600 border-gray-100' };
                      const isThisItemPending = pendingItemId === m.id && isPending;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleAssignMeal(m.id)}
                          disabled={isPending}
                          className="relative w-full text-right p-4 rounded-2xl border-2 border-border-light hover:border-qwaam-yellow hover:bg-yellow-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                        >
                          {isThisItemPending && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
                              <ArrowPathIcon className="w-6 h-6 animate-spin text-yellow-500" />
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Meal type badge inside the picker */}
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border mb-1.5 ${mealType.class}`}>
                                {mealType.icon} {mealType.label}
                              </span>
                              <h4 className="font-extrabold text-text-main text-base truncate">{m.nameAr}</h4>
                              <p className="text-text-muted text-xs font-bold mt-0.5">{m.calories} سعرة حرارية</p>
                            </div>
                            {/* Vertical macro stack */}
                            <div className="flex flex-col gap-1 text-[10px] font-bold shrink-0">
                              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-center">P {m.macros.protein}g</span>
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-center">C {m.macros.carbs}g</span>
                              <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md text-center">F {m.macros.fats}g</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* ── All-assigned empty state ── */}
                    {((dialogType === 'workout' && availableWorkouts.length === 0) ||
                      (dialogType === 'meal'    && availableMeals.length === 0)) && (
                      <div className="py-14 text-center flex flex-col items-center">
                        <CheckCircleIcon className="w-14 h-14 text-green-300 mb-3" />
                        <p className="font-bold text-sm text-text-main">تم تعيين جميع العناصر المتاحة!</p>
                        <p className="text-xs font-bold text-text-muted mt-1">أضف المزيد للمكتبة أولاً لتتمكن من التعيين.</p>
                      </div>
                    )}
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

// ── Shared empty-list placeholder ────────────────────────────────────────────

function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return (
    <div className="py-14 px-6 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-border-light">
      <span className="text-4xl grayscale opacity-40 mb-3 block">{icon}</span>
      <p className="text-sm font-bold text-text-muted">{msg}</p>
    </div>
  );
}
