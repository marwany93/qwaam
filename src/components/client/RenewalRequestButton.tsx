'use client';

import { useState, useTransition } from 'react';
import { requestRenewal } from '@/actions/client-actions';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  alreadyRequested?: boolean;
}

export default function RenewalRequestButton({ alreadyRequested }: Props) {
  const [isPending, startTransition] = useTransition();
  const [requested, setRequested] = useState(alreadyRequested ?? false);
  const [message, setMessage] = useState('');

  const handleRequest = () => {
    startTransition(async () => {
      const res = await requestRenewal();
      setMessage(res.message);
      if (res.success) setRequested(true);
    });
  };

  if (requested) {
    return (
      <div className="mt-4 w-full text-center py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-black">
        ✅ {message || 'تم إرسال طلب التجديد، سيتواصل معك المدرب قريباً.'}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {message && !requested && (
        <p className="text-xs font-bold text-red-500 text-center">{message}</p>
      )}
      <button
        onClick={handleRequest}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 shadow-md shadow-qwaam-pink/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowPathIcon className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'جاري الإرسال...' : 'طلب تجديد الاشتراك'}
      </button>
    </div>
  );
}
