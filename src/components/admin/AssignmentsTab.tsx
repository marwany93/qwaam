'use client';

import { Fragment, useState, useTransition } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
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
} from '@heroicons/react/24/outline';

interface Props {
  traineeUid: string;
  assignedWorkouts: Workout[];
  assignedMeals: Meal[];
  allWorkouts: Workout[];
  allMeals: Meal[];
}

export default function AssignmentsTab({
  traineeUid,
  assignedWorkouts,
  assignedMeals,
  allWorkouts,
  allMeals,
}: Props) {
  const [dialogType, setDialogType] = useState<'workout' | 'meal' | null>(null);
  const [isPending, startTransition] = useTransition();

  // IDs already assigned — for filtering the "available" picker below
  const assignedWorkoutIds = new Set(assignedWorkouts.map((w) => w.id));
  const assignedMealIds = new Set(assignedMeals.map((m) => m.id));

  const availableWorkouts = allWorkouts.filter((w) => !assignedWorkoutIds.has(w.id));
  const availableMeals = allMeals.filter((m) => !assignedMealIds.has(m.id));

  function handleAssignWorkout(workoutId: string) {
    startTransition(async () => {
      await assignWorkout(traineeUid, workoutId);
      setDialogType(null);
    });
  }

  function handleRemoveWorkout(workoutId: string) {
    startTransition(async () => {
      await removeAssignedWorkout(traineeUid, workoutId);
    });
  }

  function handleAssignMeal(mealId: string) {
    startTransition(async () => {
      await assignMeal(traineeUid, mealId);
      setDialogType(null);
    });
  }

  function handleRemoveMeal(mealId: string) {
    startTransition(async () => {
      await removeAssignedMeal(traineeUid, mealId);
    });
  }

  const difficultyColor: Record<string, string> = {
    beginner: 'bg-green-50 text-green-700',
    intermediate: 'bg-yellow-50 text-yellow-700',
    advanced: 'bg-red-50 text-red-600',
  };

  return (
    <>
      {/* ── Workouts Section ── */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-text-main">البرامج التدريبية المعينة</h3>
            <p className="text-text-muted text-sm font-bold mt-1">
              {assignedWorkouts.length} برنامج معين حالياً
            </p>
          </div>
          <button
            onClick={() => setDialogType('workout')}
            disabled={isPending || availableWorkouts.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-text-main text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0"
          >
            <PlusCircleIcon className="w-5 h-5" />
            تعيين برنامج
          </button>
        </div>

        {assignedWorkouts.length === 0 ? (
          <EmptyState icon="🏋️‍♂️" msg="لا توجد برامج معينة لهذا المتدرب بعد." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignedWorkouts.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-5 border border-border-light shadow-sm flex justify-between items-start gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-black px-2 py-1 rounded-lg uppercase ${
                        difficultyColor[w.difficulty] || 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {w.difficulty}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-text-main text-base truncate">{w.titleAr}</h4>
                  <p className="text-text-muted text-xs font-bold mt-1">
                    ⏱ {w.duration} دقيقة · {w.exercises?.length || 0} تمرين
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveWorkout(w.id)}
                  disabled={isPending}
                  className="text-red-300 hover:text-red-500 transition-colors mt-1 shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-light" />

      {/* ── Meals Section ── */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-text-main">الوجبات الغذائية المعينة</h3>
            <p className="text-text-muted text-sm font-bold mt-1">
              {assignedMeals.length} وجبة معينة حالياً
            </p>
          </div>
          <button
            onClick={() => setDialogType('meal')}
            disabled={isPending || availableMeals.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-border-light text-text-main shadow-sm hover:border-qwaam-yellow hover:bg-yellow-50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0"
          >
            <PlusCircleIcon className="w-5 h-5 text-yellow-500" />
            تعيين وجبة
          </button>
        </div>

        {assignedMeals.length === 0 ? (
          <EmptyState icon="🥗" msg="لا توجد وجبات معينة لهذا المتدرب بعد." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignedMeals.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl p-5 border border-border-light shadow-sm flex justify-between items-start gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-text-main text-base truncate">{m.nameAr}</h4>
                  <p className="text-text-muted text-xs font-bold mt-1 mb-3">{m.nameEn}</p>
                  <div className="flex gap-2 text-xs font-black">
                    <span className="bg-gray-100 text-text-main px-2 py-1 rounded-lg">
                      🔥 {m.calories} سعرة
                    </span>
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg">
                      P {m.macros.protein}g
                    </span>
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                      C {m.macros.carbs}g
                    </span>
                    <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg">
                      F {m.macros.fats}g
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMeal(m.id)}
                  disabled={isPending}
                  className="text-red-300 hover:text-red-500 transition-colors mt-1 shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Library Picker Dialog ── */}
      <Transition appear show={dialogType !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDialogType(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-text-main/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto" dir="rtl">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg bg-qwaam-white rounded-3xl p-8 shadow-2xl border border-border-light">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-2xl font-extrabold text-text-main flex items-center gap-2">
                      <BookOpenIcon className="w-6 h-6 text-qwaam-pink" />
                      {dialogType === 'workout' ? 'اختر برنامجاً تدريبياً' : 'اختر وجبة غذائية'}
                    </Dialog.Title>
                    <button onClick={() => setDialogType(null)} className="p-2 rounded-full text-text-muted hover:text-qwaam-pink hover:bg-qwaam-pink-light transition-colors">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto px-1">
                    {dialogType === 'workout' &&
                      availableWorkouts.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => handleAssignWorkout(w.id)}
                          disabled={isPending}
                          className="w-full text-right p-4 rounded-2xl border-2 border-border-light hover:border-qwaam-pink hover:bg-qwaam-pink-light transition-all group disabled:opacity-50"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-text-main text-base truncate group-hover:text-qwaam-pink transition-colors">{w.titleAr}</h4>
                              <p className="text-text-muted text-xs font-bold mt-0.5">{w.duration} دقيقة · {w.exercises?.length || 0} تمرين</p>
                            </div>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ml-3 ${difficultyColor[w.difficulty] || 'bg-gray-50 text-gray-600'}`}>{w.difficulty}</span>
                          </div>
                        </button>
                      ))}

                    {dialogType === 'meal' &&
                      availableMeals.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleAssignMeal(m.id)}
                          disabled={isPending}
                          className="w-full text-right p-4 rounded-2xl border-2 border-border-light hover:border-qwaam-yellow hover:bg-yellow-50 transition-all group disabled:opacity-50"
                        >
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-text-main text-base truncate">{m.nameAr}</h4>
                              <p className="text-text-muted text-xs font-bold mt-0.5">{m.calories} سعرة حرارية</p>
                            </div>
                            <div className="flex gap-1 text-xs font-bold shrink-0">
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md">P{m.macros.protein}</span>
                              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md">C{m.macros.carbs}</span>
                            </div>
                          </div>
                        </button>
                      ))}

                    {/* Empty State inside Dialog */}
                    {((dialogType === 'workout' && availableWorkouts.length === 0) ||
                      (dialogType === 'meal' && availableMeals.length === 0)) && (
                      <p className="text-center text-text-muted font-bold py-12 text-sm">
                        تم تعيين جميع العناصر المتاحة!
                      </p>
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

function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return (
    <div className="py-14 px-6 text-center text-text-muted flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-border-light">
      <span className="text-4xl grayscale opacity-40 mb-3 block">{icon}</span>
      <p className="text-sm font-bold">{msg}</p>
    </div>
  );
}
