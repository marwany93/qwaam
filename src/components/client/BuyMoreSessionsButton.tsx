'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestMoreSessions } from '@/actions/client-actions';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function BuyMoreSessionsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleClick = () => {
    setError('');
    startTransition(async () => {
      const res = await requestMoreSessions();
      if (res.success) {
        // Refresh the server component so PendingPaymentBanner appears
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="mt-4 space-y-2">
      {error && (
        <p className="text-xs font-bold text-red-500 text-center">{error}</p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 shadow-md shadow-qwaam-pink/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            جاري الإرسال...
          </>
        ) : (
          <>
            <ShoppingCartIcon className="w-5 h-5" />
            اشتري حصصاً إضافية
          </>
        )}
      </button>
    </div>
  );
}
