'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { addMeal } from '@/actions/library-actions';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AddMealModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const res = await addMeal(formData);
    if (res.error) setError(res.error);
    else closeModal();
    
    setLoading(false);
  }

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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-qwaam-white p-8 sm:p-10 text-right align-middle shadow-2xl transition-all border border-border-light">
                
                <div className="flex justify-between items-center mb-8">
                  <Dialog.Title as="h3" className="text-3xl font-extrabold text-text-main">
                    إضافة وجبة غذائية
                  </Dialog.Title>
                  <button onClick={closeModal} className="p-2 rounded-full text-text-muted hover:text-qwaam-yellow hover:bg-yellow-100 transition-colors" disabled={loading}>
                    <XMarkIcon className="w-7 h-7" />
                  </button>
                </div>

                <form action={handleSubmit} className="space-y-6">
                  
                  {/* Semantic Titles */}
                  <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-border-light">
                      <div>
                        <label className="block text-sm font-bold text-text-main mb-2">اسم الوجبة (بالعربية)</label>
                        <input type="text" name="nameAr" required disabled={loading} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-light focus:border-qwaam-yellow focus:ring-0 outline-none transition-all font-bold text-sm" placeholder="دجاج مع الأرز والبروكلي..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-text-main mb-2">الاسم (بالانجليزية)</label>
                        <input type="text" name="nameEn" required dir="ltr" disabled={loading} className="w-full text-left px-4 py-3.5 rounded-xl border-2 border-border-light focus:border-qwaam-yellow focus:ring-0 outline-none transition-all font-bold text-sm" placeholder="Chicken & Rice with Broccoli..." />
                      </div>
                  </div>
                  
                  {/* Macros Configurator */}
                  <div className="grid grid-cols-3 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-border-light relative overflow-hidden">
                     
                     <div className="col-span-3 pb-3 border-b border-white">
                       <label className="block text-xs uppercase tracking-wider font-black text-text-muted mb-2">إجمالي السعرات الحرارية</label>
                       <input type="number" name="calories" required min="0" disabled={loading} className="w-full px-4 py-4 rounded-xl border-2 border-border-light focus:border-text-main outline-none font-black text-lg text-center shadow-inner" placeholder="E.g 450" />
                     </div>
                     
                     <div className="pt-2">
                       <label className="block text-xs uppercase tracking-wider font-extrabold text-red-500 mb-2 text-center">البروتين</label>
                       <div className="relative">
                         <input type="number" name="protein" required min="0" disabled={loading} className="w-full px-2 py-3.5 rounded-xl border-2 border-red-100 bg-red-50 focus:border-red-400 outline-none text-center font-bold text-red-700" placeholder="0" />
                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-red-400">g</span>
                       </div>
                     </div>
                     <div className="pt-2">
                       <label className="block text-xs uppercase tracking-wider font-extrabold text-green-600 mb-2 text-center">الكاربوهيدرات</label>
                       <div className="relative">
                         <input type="number" name="carbs" required min="0" disabled={loading} className="w-full px-2 py-3.5 rounded-xl border-2 border-green-100 bg-green-50 focus:border-green-400 outline-none text-center font-bold text-green-700" placeholder="0" />
                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-green-400">g</span>
                       </div>
                     </div>
                     <div className="pt-2">
                       <label className="block text-xs uppercase tracking-wider font-extrabold text-yellow-600 mb-2 text-center">الدهون</label>
                       <div className="relative">
                         <input type="number" name="fats" required min="0" disabled={loading} className="w-full px-2 py-3.5 rounded-xl border-2 border-yellow-100 bg-yellow-50 focus:border-yellow-400 outline-none text-center font-bold text-yellow-700" placeholder="0" />
                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-yellow-500">g</span>
                       </div>
                     </div>
                  </div>

                  {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center justify-center animate-in fade-in zoom-in duration-200">{error}</div>}

                  <div className="pt-2">
                     <button type="submit" disabled={loading} className="w-full rounded-xl bg-qwaam-yellow px-4 py-4 text-lg font-bold text-text-main shadow-lg shadow-qwaam-yellow/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none">
                       {loading ? <span className="animate-pulse">جاري التحقق...</span> : 'إضافة الوجبة إلى المكتبة'}
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
