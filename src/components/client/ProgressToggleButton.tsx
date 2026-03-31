'use client';

import { useState, useTransition } from 'react';
import { toggleProgress } from '@/actions/progress-actions';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
      className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border font-black text-sm transition-all duration-300 active:scale-95 disabled:opacity-50 ${
        checked ? activeClass : idleClass
      }`}
    >
      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all duration-300 ${
        checked 
          ? 'border-white bg-white/20' 
          : 'border-border-light bg-gray-50'
      }`}>
        <div className={`transition-all duration-300 transform ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0 text-transparent'}`}>
          <CheckIcon />
        </div>
      </div>
      {checked ? 'تم الإنجاز' : 'تسجيل الإنجاز'}
    </button>
  );
}
