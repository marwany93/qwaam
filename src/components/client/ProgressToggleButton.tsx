'use client';

import { useState, useTransition } from 'react';
import { toggleProgress } from '@/actions/progress-actions';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// Inline spinner so we don't pull in a heavy icon library just for this
const SpinnerIcon = () => (
  <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function ProgressToggleButton({ 
  itemId, 
  type, 
  initialState, 
  date 
}: { 
  itemId: string; 
  type: 'workout'|'meal'; 
  initialState: boolean; 
  date: string; 
}) {
  const [checked, setChecked] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextState = !checked;
    setChecked(nextState); // optimistic update
    
    startTransition(async () => {
      try {
        await toggleProgress(itemId, type, date);
      } catch (e) {
        setChecked(!nextState); // revert on error
        console.error('Failed to toggle progress');
      }
    });
  };

  const isWorkout = type === 'workout';
  
  const activeClass = isWorkout 
    ? 'bg-qwaam-pink text-white border-qwaam-pink shadow-md shadow-qwaam-pink/20' 
    : 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20';

  const idleClass = isWorkout
    ? 'bg-white border-border-light text-text-muted hover:border-qwaam-pink/40 hover:text-qwaam-pink'
    : 'bg-white border-border-light text-text-muted hover:border-yellow-400/50 hover:text-yellow-600';

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border font-black text-sm transition-all duration-300 active:scale-95 disabled:cursor-not-allowed ${
        checked ? activeClass : idleClass
      } ${isPending ? 'opacity-70' : ''}`}
    >
      {isPending ? (
        // Loading state: spinner replaces the check icon, text signals updating
        <>
          <div className="w-5 h-5 rounded-lg flex items-center justify-center border border-current opacity-50">
            <SpinnerIcon />
          </div>
          جاري التحديث...
        </>
      ) : (
        // Idle / checked state: animated check box + Arabic label
        <>
          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all duration-300 ${
            checked ? 'border-white bg-white/20' : 'border-border-light bg-gray-50'
          }`}>
            <div className={`transition-all duration-300 transform ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0 text-transparent'}`}>
              <CheckIcon />
            </div>
          </div>
          {checked ? 'تم الإنجاز' : 'تسجيل الإنجاز'}
        </>
      )}
    </button>
  );
}
