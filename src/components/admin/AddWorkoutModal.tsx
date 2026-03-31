'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { addWorkout } from '@/actions/library-actions';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ExerciseState {
  name: string;
  sets: number | '';
  reps: string;
  notes: string;
}

export default function AddWorkoutModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize with exactly 1 empty exercise row
  const [exercises, setExercises] = useState<ExerciseState[]>([
    { name: '', sets: '', reps: '', notes: '' }
  ]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    
    // Core Logic: Map Client React array to stringified JSON for seamless Next.js FormData posting
    formData.append('exercisesJson', JSON.stringify(exercises.map(e => ({
       ...e,
       sets: Number(e.sets) || 0
    }))));

    const res = await addWorkout(formData);
    
    if (res.error) {
      setError(res.error);
    } else {
      setExercises([{ name: '', sets: '', reps: '', notes: '' }]);
      closeModal();
    }
    setLoading(false);
  }

  function addExerciseRow() {
    setExercises([...exercises, { name: '', sets: '', reps: '', notes: '' }]);
  }

  function removeExerciseRow(index: number) {
    const newEx = [...exercises];
    newEx.splice(index, 1);
    setExercises(newEx);
  }

  function updateExercise(index: number, field: keyof ExerciseState, value: string | number) {
    const newEx = [...exercises];
    newEx[index] = { ...newEx[index], [field]: value };
    setExercises(newEx);
  }

  // Handle Dialog dismissal explicitly to prevent data loss mid-upload
  const handleDimiss = () => loading ? null : closeModal();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleDimiss}>
        
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-text-main/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto" dir="rtl">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4">
              
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-qwaam-white p-6 sm:p-10 text-right align-middle shadow-2xl transition-all border border-border-light relative">
                
                <div className="flex justify-between items-center mb-8">
                  <Dialog.Title as="h3" className="text-3xl font-extrabold text-text-main">
                    بناء برنامج تدريبي
                  </Dialog.Title>
                  <button type="button" onClick={closeModal} className="p-2 rounded-full text-text-muted hover:text-qwaam-pink hover:bg-qwaam-pink-light transition-colors" disabled={loading}>
                    <XMarkIcon className="w-7 h-7" />
                  </button>
                </div>

                <form action={handleSubmit} className="space-y-6">
                  
                  {/* Metadata Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-border-light">
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">اسم البرنامج (بالعربية)</label>
                      <input type="text" name="titleAr" required disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none transition-all font-bold text-sm" placeholder="تمارين المقاومة الشاملة..." />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">الاسم (بالانجليزية)</label>
                      <input type="text" name="titleEn" required dir="ltr" disabled={loading} className="w-full text-left px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none transition-all font-bold text-sm" placeholder="Full Body Resistance..." />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">مستوى الصعوبة</label>
                      <select name="difficulty" required disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none font-bold text-sm bg-white">
                        <option value="beginner">مبتدئ (Beginner)</option>
                        <option value="intermediate">متوسط (Intermediate)</option>
                        <option value="advanced">متقدم (Advanced)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">مدة التمارين (بالدقائق)</label>
                      <input type="number" name="duration" required min="1" disabled={loading} className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none font-bold text-sm" placeholder="45" />
                    </div>
                  </div>

                  {/* Exercises Dynamic Generator */}
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <h4 className="font-black text-text-main text-xl">تفاصيل التمارين</h4>
                      <button type="button" onClick={addExerciseRow} className="text-qwaam-pink font-bold text-sm bg-qwaam-pink-light px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-pink-100 transition-colors">
                        <PlusIcon className="w-5 h-5" /> إضافة حركة
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 pb-4">
                      {exercises.map((ex, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border-2 border-border-light shadow-sm relative group hover:border-qwaam-pink/50 transition-colors">
                           
                           {/* Trash Action */}
                           {exercises.length > 1 && (
                             <button type="button" onClick={() => removeExerciseRow(i)} className="absolute top-2 left-2 text-red-400 hover:text-red-600 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full p-1 z-10">
                               <TrashIcon className="w-5 h-5"/>
                             </button>
                           )}

                           <div className="flex-[2]">
                             <label className="block text-xs font-bold text-text-muted mb-1 px-1">اسم التمرين الجسدي</label>
                             <input type="text" placeholder="مثال: Barbell Squats" required value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} className="w-full py-2.5 px-3 border border-border-light focus:border-qwaam-pink outline-none rounded-lg text-sm font-bold bg-gray-50 focus:bg-white" />
                           </div>
                           <div className="flex-1 sm:max-w-[100px]">
                             <label className="block text-xs font-bold text-text-muted mb-1 px-1 text-center">عدد الجولات</label>
                             <input type="number" placeholder="4" required min="1" value={ex.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} className="w-full py-2.5 px-3 border border-border-light focus:border-qwaam-pink outline-none rounded-lg text-sm font-bold bg-gray-50 focus:bg-white text-center" />
                           </div>
                           <div className="flex-1 sm:max-w-[120px]">
                             <label className="block text-xs font-bold text-text-muted mb-1 px-1 text-center" dir="ltr">TUT/Reps</label>
                             <input type="text" placeholder="10-12" required value={ex.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} className="w-full py-2.5 px-3 border border-border-light focus:border-qwaam-pink outline-none rounded-lg text-sm font-bold bg-gray-50 focus:bg-white text-center" dir="ltr" />
                           </div>
                           <div className="flex-[1.5]">
                             <label className="block text-xs font-bold text-text-muted mb-1 px-1">تعليمات/ملاحظات (اختياري)</label>
                             <input type="text" placeholder="رتم بطيء..." value={ex.notes} onChange={(e) => updateExercise(i, 'notes', e.target.value)} className="w-full py-2.5 px-3 border border-border-light focus:border-qwaam-pink outline-none rounded-lg text-sm font-bold bg-gray-50 focus:bg-white" />
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center justify-center animate-in fade-in zoom-in duration-200">{error}</div>
                  )}

                  <div className="pt-6 border-t border-border-light">
                    <button type="submit" disabled={loading || exercises.length === 0} className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-qwaam-pink px-4 py-4 text-lg font-bold text-white shadow-lg shadow-qwaam-pink/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none">
                      {loading ? <span className="animate-pulse">جاري اعتماد البرنامج...</span> : 'حفظ ونشر البرنامج التدريبي'}
                    </button>
                  </div>
                </form>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
