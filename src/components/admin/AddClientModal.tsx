'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { addClient } from '@/actions/admin-actions';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AddClientModal({
  isOpen,
  closeModal,
}: {
  isOpen: boolean;
  closeModal: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successLink, setSuccessLink] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    
    // Call the Firebase Admin SDK Server Action!
    const res = await addClient(formData);
    
    if (res.error) {
      setError(res.error);
    } else if (res.success && res.resetLink) {
      setSuccessLink(res.resetLink);
    }
    
    setLoading(false);
  }

  function handleResetAndClose() {
    setSuccessLink('');
    setError('');
    closeModal();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : handleResetAndClose}>
        
        {/* Backdrop overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-text-main/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto" dir="rtl">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-qwaam-white p-8 text-right align-middle shadow-2xl transition-all border border-border-light relative">
                
                {/* Header Sequence */}
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-extrabold text-text-main">
                    {!successLink ? 'إضافة متدرب جديد' : 'تمت الإضافة بنجاح'}
                  </Dialog.Title>
                  <button 
                    onClick={handleResetAndClose} 
                    className="p-1 rounded-full text-text-muted hover:text-qwaam-pink hover:bg-qwaam-pink-light transition-colors"
                    disabled={loading}
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* --- NORMAL FORM STATE --- */}
                {!successLink ? (
                  <form action={handleSubmit} className="space-y-5">
                    
                    {/* Name Input */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">الاسم الكامل</label>
                      <input
                        type="text"
                        name="name"
                        required
                        disabled={loading}
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-border-light focus:border-qwaam-pink focus:ring-0 outline-none transition-all font-medium text-text-main"
                        placeholder="أحمد علي..."
                      />
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        name="email"
                        required
                        disabled={loading}
                        dir="ltr"
                        className="w-full px-4 py-3.5 text-left rounded-xl border-2 border-border-light focus:border-qwaam-pink focus:ring-0 outline-none transition-all font-medium text-text-main"
                        placeholder="ahmed@example.com"
                      />
                    </div>

                    {/* Error Box */}
                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100 shadow-sm">
                        {error}
                      </div>
                    )}

                    {/* Form Submission */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-qwaam-pink px-4 py-4 text-lg font-bold text-white hover:bg-pink-600 shadow-lg shadow-qwaam-pink/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                      >
                        {loading ? (
                          <span className="animate-pulse">جاري تكوين الحساب...</span>
                        ) : (
                          'إضافة للبرنامج'
                        )}
                      </button>
                    </div>
                  </form>

                ) : (
                  
                /* --- SUCCESS STATE (LINK GENERATION) --- */
                  <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_0_10px_rgba(34,197,94,0.1)]">
                       <CheckCircleIcon className="w-12 h-12 text-green-500" />
                    </div>
                    
                    <h4 className="text-2xl font-extrabold text-text-main mb-3">حساب المتدرب جاهز!</h4>
                    <p className="text-text-muted text-sm mb-8 leading-relaxed font-medium px-4">
                      قم بنسخ هذا الرابط وأرسله للمتدرب الجديد. سيسمح له بتعيين كلمة مروره وتسجيل الدخول للمنصة.
                    </p>
                    
                    {/* The Secure Reset Link provided by Firebase Admin */}
                    <div className="relative group cursor-copy">
                      <div className="bg-qwaam-pink-light p-4 rounded-xl border-2 border-qwaam-pink/30 text-left mb-8 shadow-inner overflow-hidden">
                        <code 
                           className="text-qwaam-pink text-sm w-full font-sans break-all select-all font-bold" 
                           dir="ltr"
                        >
                          {successLink}
                        </code>
                      </div>
                    </div>

                    <button
                      onClick={handleResetAndClose}
                      className="w-full inline-flex justify-center rounded-xl bg-gray-100 border border-gray-200 px-4 py-4 text-base font-bold text-text-main hover:bg-gray-200 transition-all hover:shadow-sm"
                    >
                      تمت المهمة
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
