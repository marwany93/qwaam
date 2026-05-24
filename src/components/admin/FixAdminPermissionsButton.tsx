'use client';

import { useState } from 'react';
import { fixAdminPermissions } from '@/actions/admin-actions';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

/**
 * ⚠️ TEMPORARY — remove once the admin custom claim is patched.
 *
 * Hardcoded to coach@qwaam.com (matches the allowlist on the server
 * action). After clicking, the admin must sign out and sign back in for
 * the new claim to take effect on their ID token.
 */
const TARGET_EMAIL = 'coach@qwaam.com';

export default function FixAdminPermissionsButton() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleFix = async () => {
    setWorking(true);
    setMessage('');
    setIsError(false);

    const res = await fixAdminPermissions(TARGET_EMAIL);

    if (res.success) {
      setMessage(res.message || 'تم بنجاح. سجّل خروج ثم دخول لتطبيق التغيير.');
      setIsError(false);
    } else {
      setMessage(res.error || 'فشلت العملية.');
      setIsError(true);
    }
    setWorking(false);
  };

  return (
    <div
      dir="rtl"
      className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="w-6 h-6 text-yellow-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-black text-yellow-900 text-sm">
            إصلاح صلاحيات الأدمن (مرة واحدة)
          </p>
          <p className="text-xs font-bold text-yellow-800/80 mt-0.5">
            يضبط custom claim إلى <span dir="ltr" className="font-mono">role:coach</span> للحساب <span dir="ltr" className="font-mono">{TARGET_EMAIL}</span>. احذف هذا الزر بعد التطبيق.
          </p>
          {message && (
            <p className={`text-xs font-black mt-2 ${isError ? 'text-red-700' : 'text-green-700'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleFix}
        disabled={working}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-yellow-950 font-black text-sm shadow-md hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 shrink-0"
      >
        {working ? (
          <>
            <span className="w-4 h-4 border-2 border-yellow-950 border-t-transparent rounded-full animate-spin" />
            جاري الإصلاح...
          </>
        ) : (
          'تطبيق الإصلاح'
        )}
      </button>
    </div>
  );
}
