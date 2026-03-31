'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import type { Workout, Meal } from '@/types';
import AddWorkoutModal from './AddWorkoutModal';
import AddMealModal from './AddMealModal';
import { PlusIcon } from '@heroicons/react/24/solid';

export default function LibraryContent({ workouts, meals }: { workouts: Workout[]; meals: Meal[]; }) {
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* ── Library Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-black text-text-main tracking-tight pb-1">مكتبة المحتوى</h1>
          <p className="text-text-muted font-bold text-lg">تحكم في البرامج التدريبية والوجبات الغذائية المتاحة للتعيين</p>
        </div>
      </div>

      <Tab.Group>
        
        {/* ── Tab Selector Nav ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-2 sm:px-4 sm:py-3 rounded-2xl border border-border-light shadow-sm sticky top-0 z-10">
          <Tab.List className="flex space-x-2 space-x-reverse min-w-full sm:min-w-0">
            <Tab className={({ selected }) =>
              `w-1/2 sm:w-48 rounded-xl py-3.5 text-sm font-extrabold leading-5 outline-none transition-all ${
                selected
                  ? 'bg-qwaam-pink-light text-qwaam-pink shadow-sm ring-1 ring-qwaam-pink/20'
                  : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
              }`
            }>
              البرامج التدريبية
            </Tab>
            <Tab className={({ selected }) =>
              `w-1/2 sm:w-48 rounded-xl py-3.5 text-sm font-extrabold leading-5 outline-none transition-all ${
                selected
                  ? 'bg-qwaam-yellow/20 text-yellow-700 shadow-sm ring-1 ring-qwaam-yellow/50'
                  : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
              }`
            }>
              قاعدة الوجبات الغذائية
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels className="mt-6">
          
          {/* ── Workouts Interactive Panel ── */}
          <Tab.Panel className="rounded-xl outline-none space-y-6 focus:outline-none">
             
             {/* Local Trigger */}
             <div className="flex justify-end">
                <button onClick={() => setWorkoutModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold bg-text-main text-white shadow-sm hover:shadow-lg shadow-text-main/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                   <PlusIcon className="w-5 h-5" /> بناء برنامج جديد
                </button>
             </div>
             
             {workouts.length === 0 ? (
               <div className="py-24 px-6 text-center text-text-muted flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-border-light shadow-sm">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                    <span className="text-5xl block grayscale opacity-50">🏋️‍♂️</span>
                 </div>
                 <h3 className="text-2xl font-black text-text-main mb-3">مكتبة البرامج فارغة</h3>
                 <p className="text-base max-w-sm font-medium">ابدأ بوضع خطط التمرين الأساسية ليتم تعيينها للمتدربين لاحقاً.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {workouts.map(w => (
                   <div key={w.id} className="bg-qwaam-white rounded-3xl p-8 border border-border-light shadow-sm hover:border-qwaam-pink/50 hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
                      {/* Decorative Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-qwaam-pink scale-transform origin-left transition-transform group-hover:scale-100 opacity-50" />
                      
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <h4 className="font-extrabold text-2xl text-text-main leading-tight">{w.titleAr}</h4>
                        <span className="shrink-0 bg-qwaam-pink-light text-qwaam-pink px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">{w.difficulty}</span>
                      </div>
                      
                      <p className="text-text-muted text-sm font-bold mb-8" dir="ltr" style={{textAlign: "right"}}>{w.titleEn}</p>
                      
                      <div className="mt-auto flex justify-between items-center text-sm font-bold text-text-main bg-gray-50/80 p-4 rounded-2xl border border-border-light/50">
                        <div className="flex items-center gap-2">
                           <span className="text-qwaam-pink text-lg">⏱</span>
                           <div>
                              <span className="block text-xs font-bold text-text-muted uppercase tracking-widest">المدة</span>
                              <span className="text-base font-black leading-none mt-0.5 block">{w.duration} د.</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-qwaam-yellow text-lg">⚡</span>
                           <div className="text-left">
                              <span className="block text-xs font-bold text-text-muted uppercase tracking-widest">تمرين</span>
                              <span className="text-base font-black leading-none mt-0.5 block" dir="ltr">{String(w.exercises?.length || 0).padStart(2, '0')}</span>
                           </div>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </Tab.Panel>

          {/* ── Meals Interactive Panel ── */}
          <Tab.Panel className="rounded-xl outline-none space-y-6 focus:outline-none">
             
             {/* Local Trigger */}
             <div className="flex justify-end">
                <button onClick={() => setMealModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold bg-white border border-border-light text-text-main shadow-sm hover:border-qwaam-yellow hover:bg-yellow-50 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                   <PlusIcon className="w-5 h-5 text-yellow-500" /> إضافة وجبة غذائية
                </button>
             </div>

             {meals.length === 0 ? (
               <div className="py-24 px-6 text-center text-text-muted flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-border-light shadow-sm">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                    <span className="text-5xl block grayscale opacity-50">🥗</span>
                 </div>
                 <h3 className="text-2xl font-black text-text-main mb-3">قاعدة الوجبات فارغة</h3>
                 <p className="text-base max-w-sm font-medium">قم بإضافة مجموعة من الوجبات الجاهزة لبناء الخطط الغذائية بشكل أسرع.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {meals.map(m => (
                   <div key={m.id} className="bg-qwaam-white rounded-3xl p-8 border border-border-light shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-qwaam-yellow opacity-70 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="pr-2 flex flex-col h-full">
                        <h4 className="font-extrabold text-2xl text-text-main mb-1.5 leading-tight">{m.nameAr}</h4>
                        <p className="text-text-muted text-sm font-bold mb-6" dir="ltr" style={{textAlign: "right"}}>{m.nameEn}</p>
                        
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex justify-between items-center border border-border-light/50">
                          <span className="text-xs font-black text-text-muted uppercase tracking-widest">السعرات الحرارية</span>
                          <span className="font-black text-3xl text-text-main tracking-tighter shadow-sm w-16 h-12 bg-white rounded-xl flex items-center justify-center border border-border-light">{m.calories}</span>
                        </div>
                        
                        <div className="mt-auto grid grid-cols-3 gap-2 text-xs font-bold text-center">
                          <div className="text-red-700 bg-red-50 py-2 rounded-xl flex flex-col items-center justify-center gap-1">
                             <span className="opacity-50 text-[10px] uppercase font-black uppercase">PROTEIN</span>
                             <span>{m.macros.protein}g</span>
                          </div>
                          <div className="text-green-700 bg-green-50 py-2 rounded-xl flex flex-col items-center justify-center gap-1">
                             <span className="opacity-50 text-[10px] uppercase font-black">CARBS</span>
                             <span>{m.macros.carbs}g</span>
                          </div>
                          <div className="text-yellow-700 bg-yellow-50 py-2 rounded-xl flex flex-col items-center justify-center gap-1">
                             <span className="opacity-50 text-[10px] uppercase font-black">FATS</span>
                             <span>{m.macros.fats}g</span>
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Global Modals Mounted Here */}
      <AddWorkoutModal isOpen={workoutModalOpen} closeModal={() => setWorkoutModalOpen(false)} />
      <AddMealModal isOpen={mealModalOpen} closeModal={() => setMealModalOpen(false)} />
      
    </div>
  );
}
