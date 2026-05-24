'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { deleteUserFully } from '@/actions/admin-actions';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  uid: string;
  name: string;
  email: string;
}

/**
 * Hard-delete confirmation. Requires the admin to type the trainee's email
 * before the destructive button enables — same pattern as GitHub's
 * "Delete repo" flow. Prevents click-through misfires on a row in a list.
 */
export default function DeleteUserModal({ open, onClose, onDeleted, uid, name, email }: Props) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canDelete = typed.trim().toLowerCase() === email.trim().toLowerCase();

  const handleClose = () => {
    if (busy) return;
    onClose();
    setTimeout(() => {
      setTyped('');
      setError('');
    }, 200);
  };

  const handleDelete = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    setError('');
    const res = await deleteUserFully(uid);
    if (res.success) {
      onDeleted();
      handleClose();
    } else {
      const detail = res.report
        ? Object.entries(res.report)
            .filter(([, v]) => !v.ok)
            .map(([k, v]) => `${k}: ${v.detail || 'failed'}`)
            .join(' · ')
        : '';
      setError(`فشل الحذف. ${detail}`);
    }
    setBusy(false);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto" dir="rtl">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-border-light overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                    </span>
                    <Dialog.Title className="font-black text-red-900">
                      حذف المتدرّبة نهائياً
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={busy}
                    className="text-red-700/60 hover:text-red-700 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm font-bold text-text-main leading-relaxed">
                    سيتم حذف <span className="font-black text-red-700">{name}</span> وجميع بياناتها:
                    حساب الدخول، خطط الوجبات، سجل التقدم، الرسائل، والصور.
                  </p>
                  <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                    ⚠️ لا يمكن التراجع عن هذه العملية.
                  </p>

                  <div>
                    <label className="block text-xs font-black text-text-muted mb-1.5 uppercase tracking-wider">
                      للتأكيد، اكتبي البريد الإلكتروني للمتدرّبة:
                    </label>
                    <p className="text-xs font-mono text-text-muted mb-2 select-all" dir="ltr">{email}</p>
                    <input
                      type="text"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      dir="ltr"
                      disabled={busy}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-red-500 outline-none text-sm font-bold bg-gray-50 focus:bg-white"
                      placeholder="example@email.com"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                      {error}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-border-light flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl text-sm font-black text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={!canDelete || busy}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black shadow-md hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        جاري الحذف...
                      </>
                    ) : (
                      'حذف نهائي'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
