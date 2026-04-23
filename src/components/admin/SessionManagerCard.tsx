'use client';

import { useState } from 'react';
import { logTraineeSession } from '@/actions/admin-actions';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';

interface Props {
  traineeUid: string;
  totalSessions: number;
  remainingSessions: number;
  planStatus: string;
}

export default function SessionManagerCard({ traineeUid, totalSessions, remainingSessions, planStatus }: Props) {
  const [loadingLog, setLoadingLog] = useState(false);
  const [error, setError] = useState('');

  const completedSessions = totalSessions - remainingSessions;
  const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const handleLogSession = async () => {
    setLoadingLog(true);
    setError('');
    const res = await logTraineeSession(traineeUid, 'تم تسجيل حضور الحصة');
    if (!res.success) setError(res.error || 'حدث خطأ');
    setLoadingLog(false);
  };


  return (
    <div className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm p-6" dir="rtl">
      <h3 className="text-xl font-black text-text-main mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-qwaam-pink-light flex items-center justify-center text-qwaam-pink">⏳</span>
        متابعة الحصص
      </h3>

      {/* Progress Bar Area */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-bold text-text-muted mb-2">
          <span>المتبقي: {remainingSessions}</span>
          <span>الإجمالي: {totalSessions}</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${planStatus === 'finished' ? 'bg-green-500' : 'bg-qwaam-pink'}`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {planStatus === 'finished' && (
          <p className="text-xs font-bold text-green-600 mt-2">✅ تم الانتهاء من جميع حصص الباقة</p>
        )}
      </div>

      {error && <p className="text-xs font-bold text-red-500 mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleLogSession}
          disabled={loadingLog || remainingSessions <= 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-text-main shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingLog ? 'جاري التسجيل...' : (
            <>
              <CheckBadgeIcon className="w-5 h-5" />
              تسجيل حضور حصة
            </>
          )}
        </button>

      </div>
    </div>
  );
}
