'use client';

import { useState } from 'react';
import { renewTraineePlan, overrideTraineeSessions } from '@/actions/admin-actions';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  traineeUid: string;
  sessionTracking?: any;
}

export default function SubscriptionManagement({ traineeUid, sessionTracking }: Props) {
  // Safe Action State
  const [renewAmount, setRenewAmount] = useState<number>(12);
  const [loadingRenew, setLoadingRenew] = useState(false);
  const [renewError, setRenewError] = useState('');
  const [renewSuccess, setRenewSuccess] = useState('');

  // Danger Zone State
  const [overrideTotal, setOverrideTotal] = useState<number>(sessionTracking?.totalSessions || 0);
  const [overrideRemaining, setOverrideRemaining] = useState<number>(sessionTracking?.remainingSessions || 0);
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');

  const handleRenewPlan = async () => {
    if (renewAmount <= 0) {
      setRenewError('يرجى إدخال عدد حصص صحيح');
      return;
    }
    setLoadingRenew(true);
    setRenewError('');
    setRenewSuccess('');
    
    const res = await renewTraineePlan(traineeUid, renewAmount);
    
    if (!res.success) {
      setRenewError(res.error || 'حدث خطأ أثناء التجديد');
    } else {
      setRenewSuccess(`تمت إضافة ${renewAmount} حصة بنجاح`);
      // Add to existing local state rather than overwriting it
      if (res.newTotal !== undefined) setOverrideTotal(res.newTotal);
      if (res.newRemaining !== undefined) setOverrideRemaining(res.newRemaining);
    }
    setLoadingRenew(false);
  };

  const handleManualOverride = async () => {
    setLoadingOverride(true);
    setOverrideError('');
    setOverrideSuccess('');

    const res = await overrideTraineeSessions(traineeUid, overrideTotal, overrideRemaining);

    if (!res.success) {
      setOverrideError(res.error || 'حدث خطأ أثناء التعديل');
    } else {
      setOverrideSuccess('تم حفظ التعديلات اليدوية بنجاح');
    }
    setLoadingOverride(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* ── Section 1: Renew Plan (Safe Action) ── */}
      <div className="bg-white rounded-3xl p-6 border border-border-light shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-black text-text-main flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-qwaam-pink-light flex items-center justify-center text-qwaam-pink">
              <ArrowPathIcon className="w-5 h-5" />
            </span>
            تجديد الباقة
          </h3>
          <p className="text-sm font-bold text-text-muted mt-1">إضافة حصص جديدة للمتدرب</p>
        </div>

        {renewError && <p className="text-xs font-bold text-red-500 mb-3 bg-red-50 p-2 rounded-lg">{renewError}</p>}
        {renewSuccess && <p className="text-xs font-bold text-green-600 mb-3 bg-green-50 p-2 rounded-lg">{renewSuccess}</p>}

        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="block text-xs font-bold text-text-muted mb-1">عدد الحصص الجديدة</label>
            <input
              type="number"
              min="1"
              value={renewAmount}
              onChange={(e) => setRenewAmount(Number(e.target.value))}
              className="w-full text-center font-black py-3 border border-border-light rounded-xl bg-gray-50 text-text-main outline-none focus:border-qwaam-pink transition-colors"
            />
          </div>
          <div className="flex-[2] flex items-end">
            <button
              onClick={handleRenewPlan}
              disabled={loadingRenew || renewAmount <= 0}
              className="w-full h-[50px] mt-[20px] flex items-center justify-center gap-2 rounded-xl font-black text-white bg-qwaam-pink hover:bg-pink-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingRenew ? 'جاري التجديد...' : 'تجديد الآن'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: Manual Override (DANGER ZONE) ── */}
      <div className="bg-red-50/50 rounded-3xl p-6 border border-red-500/50 shadow-sm relative overflow-hidden">
        {/* Warning Stripe Pattern */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500"></div>
        
        <div className="mb-5">
          <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </span>
            تعديل يدوي (منطقة خطرة)
          </h3>
          <p className="text-sm font-bold text-red-500/80 mt-1">
            تعديل الأرقام الحالية مباشرة (يستخدم في حالات الاستثناء فقط)
          </p>
        </div>

        {overrideError && <p className="text-xs font-bold text-red-600 mb-3 bg-red-100 p-2 rounded-lg">{overrideError}</p>}
        {overrideSuccess && <p className="text-xs font-bold text-green-700 mb-3 bg-green-50 p-2 rounded-lg">{overrideSuccess}</p>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-red-800 mb-1">إجمالي الحصص</label>
            <input
              type="number"
              min="0"
              value={overrideTotal}
              onChange={(e) => setOverrideTotal(Number(e.target.value))}
              className="w-full text-center font-black py-3 border border-red-200 rounded-xl bg-white text-red-900 outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-red-800 mb-1">الحصص المتبقية</label>
            <input
              type="number"
              min="0"
              value={overrideRemaining}
              onChange={(e) => setOverrideRemaining(Number(e.target.value))}
              className="w-full text-center font-black py-3 border border-red-200 rounded-xl bg-white text-red-900 outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleManualOverride}
          disabled={loadingOverride}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingOverride ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>

    </div>
  );
}
