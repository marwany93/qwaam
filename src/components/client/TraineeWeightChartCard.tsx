'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon } from '@heroicons/react/24/solid';
import type { ProgressEntry } from '@/types';
import WeightChart from '@/components/client/WeightChart';

// Lazy-load the log modal so the chart card itself stays tiny on initial paint
const LogProgressForm = dynamic(() => import('@/components/client/LogProgressForm'), { ssr: false });

interface Props {
  initialData: ProgressEntry[];
}

/**
 * Trainee-only wrapper around WeightChart. Owns the LogProgressForm
 * modal so the empty-state CTA opens the same flow as ProgressLogTrigger.
 * Admin views render <WeightChart /> directly without this wrapper —
 * the coach can't log entries on behalf of a trainee.
 */
export default function TraineeWeightChartCard({ initialData }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <WeightChart
        data={initialData}
        emptyCta={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-qwaam-pink text-white font-black text-sm shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-95 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            سجلي قياسك الأول
          </button>
        }
      />
      <LogProgressForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
