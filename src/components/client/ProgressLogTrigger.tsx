'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChartBarIcon, PlusIcon } from '@heroicons/react/24/solid';

// Lazy-load the modal so its Headless UI + Firebase Storage deps don't
// ship with the initial dashboard payload — only after the trainee clicks.
const LogProgressForm = dynamic(() => import('@/components/client/LogProgressForm'), { ssr: false });

export default function ProgressLogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section
        dir="rtl"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20 shrink-0">
            <ChartBarIcon className="w-6 h-6" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-text-main">سجّلي تقدمك الأسبوعي</h3>
            <p className="text-xs sm:text-sm font-bold text-text-muted mt-0.5">
              المتابعة المنتظمة تساعد مدرّبك على تعديل خطتك حسب نتائجك.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-qwaam-pink text-white font-black text-sm shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-95 transition-all shrink-0"
        >
          <PlusIcon className="w-5 h-5" />
          سجل جديد
        </button>
      </section>

      <LogProgressForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
