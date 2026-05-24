'use client';

import { Fragment, useRef, useState, useTransition } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';
import { logProgress, type LogProgressInput } from '@/actions/client-actions';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid';

interface Props {
  open: boolean;
  onClose: () => void;
}

type PhotoSlot = 'front' | 'side' | 'back';

const PHOTO_SLOTS: { key: PhotoSlot; label: string; arabic: string }[] = [
  { key: 'front', label: 'Front', arabic: 'أمامية' },
  { key: 'side',  label: 'Side',  arabic: 'جانبية' },
  { key: 'back',  label: 'Back',  arabic: 'خلفية' },
];

const inputCls =
  'w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold transition-colors bg-gray-50 focus:bg-white';
const labelCls = 'block text-xs font-black text-text-muted mb-1.5 uppercase tracking-wider';

export default function LogProgressForm({ open, onClose }: Props) {
  // ── Form state ────────────────────────────────────────────
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [abs, setAbs] = useState('');
  const [glutes, setGlutes] = useState('');
  const [thighs, setThighs] = useState('');
  const [notes, setNotes] = useState('');

  // Photos: per-slot file + uploaded url + uploading flag
  const [photos, setPhotos] = useState<Record<PhotoSlot, { url?: string; uploading: boolean }>>({
    front: { uploading: false },
    side:  { uploading: false },
    back:  { uploading: false },
  });
  const fileRefs = {
    front: useRef<HTMLInputElement>(null),
    side:  useRef<HTMLInputElement>(null),
    back:  useRef<HTMLInputElement>(null),
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTx] = useTransition();

  const anyPhotoUploading = Object.values(photos).some((p) => p.uploading);

  // ── Reset on close ────────────────────────────────────────
  const handleClose = () => {
    if (isPending || anyPhotoUploading) return;          // don't close mid-flight
    onClose();
    // Defer the reset so the closing animation isn't visually disturbed
    setTimeout(() => {
      setWeight(''); setBodyFat('');
      setChest(''); setWaist(''); setAbs(''); setGlutes(''); setThighs('');
      setNotes('');
      setPhotos({ front: { uploading: false }, side: { uploading: false }, back: { uploading: false } });
      setError(''); setSuccess('');
    }, 200);
  };

  // ── Photo upload ──────────────────────────────────────────
  const handlePhotoChange = async (slot: PhotoSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يجب اختيار صورة فقط.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('انتهت الجلسة. أعيدي تسجيل الدخول.');
      return;
    }

    setError('');
    setPhotos((p) => ({ ...p, [slot]: { ...p[slot], uploading: true } }));

    try {
      // Hierarchical path: progress_photos/{uid}/{timestamp}_{type}.{ext}
      // The {uid} segment lets Storage rules enforce ownership via path matching.
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `progress_photos/${uid}/${Date.now()}_${slot}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotos((p) => ({ ...p, [slot]: { url, uploading: false } }));
    } catch (err) {
      console.error(`Upload (${slot}) failed:`, err);
      setError('فشل رفع الصورة. حاولي مجدداً.');
      setPhotos((p) => ({ ...p, [slot]: { ...p[slot], uploading: false } }));
    }
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (anyPhotoUploading) {
      setError('يرجى الانتظار حتى انتهاء رفع الصور.');
      return;
    }

    const weightNum = Number(weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError('يرجى إدخال وزن صحيح.');
      return;
    }

    // Build optional measurements only when at least one is filled
    const m = {
      chest:  chest  ? Number(chest)  : undefined,
      waist:  waist  ? Number(waist)  : undefined,
      abs:    abs    ? Number(abs)    : undefined,
      glutes: glutes ? Number(glutes) : undefined,
      thighs: thighs ? Number(thighs) : undefined,
    };
    const hasMeasurements = Object.values(m).some((v) => v !== undefined);

    // Build photos object only when at least one url is set
    const photoUrls = {
      frontUrl: photos.front.url,
      sideUrl:  photos.side.url,
      backUrl:  photos.back.url,
    };
    const hasPhotos = Object.values(photoUrls).some(Boolean);

    const payload: LogProgressInput = {
      weight: weightNum,
      bodyFat: bodyFat ? Number(bodyFat) : undefined,
      measurements: hasMeasurements ? m : undefined,
      photos: hasPhotos ? photoUrls : undefined,
      notes: notes.trim() || undefined,
    };

    startTx(async () => {
      const res = await logProgress(payload);
      if (res.success) {
        setSuccess('تم حفظ سجلك بنجاح! 🎉');
        // Auto-close after a short celebration so the dashboard re-fetches via revalidatePath
        setTimeout(() => handleClose(), 1500);
      } else {
        setError(res.error || 'حدث خطأ غير متوقع.');
      }
    });
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto" dir="rtl">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-border-light overflow-hidden">

                {/* Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-border-light bg-gradient-to-l from-qwaam-pink-light/40 to-transparent flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-qwaam-pink text-white flex items-center justify-center shadow-sm">
                      <ChartBarIcon className="w-5 h-5" />
                    </span>
                    <div>
                      <Dialog.Title className="text-xl font-black text-text-main">سجّلي تقدمك</Dialog.Title>
                      <p className="text-xs font-bold text-text-muted">المتابعة المنتظمة هي مفتاح النتائج المستدامة.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isPending || anyPhotoUploading}
                    className="p-2 rounded-full text-text-muted hover:text-qwaam-pink hover:bg-white transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-6">

                  {/* Vitals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>الوزن (كجم) <span className="text-red-500">*</span></label>
                      <input
                        type="number" step="0.1" min="0"
                        value={weight} onChange={(e) => setWeight(e.target.value)}
                        placeholder="مثلاً: 65.5"
                        className={inputCls} required disabled={isPending}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>نسبة الدهون % (اختياري)</label>
                      <input
                        type="number" step="0.1" min="0" max="100"
                        value={bodyFat} onChange={(e) => setBodyFat(e.target.value)}
                        placeholder="مثلاً: 22"
                        className={inputCls} disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* Measurements */}
                  <div className="bg-gray-50 border border-border-light rounded-2xl p-4 space-y-3">
                    <h4 className="font-black text-text-main text-sm">المقاسات (سم) — اختياري</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: 'صدر', state: chest,  set: setChest },
                        { label: 'خصر', state: waist,  set: setWaist },
                        { label: 'بطن', state: abs,    set: setAbs },
                        { label: 'أرداف', state: glutes, set: setGlutes },
                        { label: 'فخذ', state: thighs, set: setThighs },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="block text-[10px] font-black text-text-muted mb-1 text-center">{f.label}</label>
                          <input
                            type="number" step="0.1" min="0"
                            value={f.state} onChange={(e) => f.set(e.target.value)}
                            className="w-full text-center px-2 py-2 rounded-xl border-2 border-border-light focus:border-qwaam-pink outline-none text-sm font-bold bg-white"
                            disabled={isPending}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="space-y-3">
                    <h4 className="font-black text-text-main text-sm">الصور (اختياري)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {PHOTO_SLOTS.map((slot) => {
                        const state = photos[slot.key];
                        return (
                          <div key={slot.key} className="space-y-1.5">
                            <p className="text-[11px] font-black text-text-muted text-center">{slot.arabic}</p>
                            <button
                              type="button"
                              onClick={() => fileRefs[slot.key].current?.click()}
                              disabled={state.uploading || isPending}
                              className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-qwaam-pink/40 bg-qwaam-pink-light/20 hover:bg-qwaam-pink-light/40 transition-all overflow-hidden flex items-center justify-center disabled:cursor-not-allowed"
                            >
                              {state.url ? (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={state.url} alt={slot.arabic} className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-md">
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                  </span>
                                </>
                              ) : state.uploading ? (
                                <span className="w-6 h-6 border-2 border-qwaam-pink border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ArrowUpTrayIcon className="w-6 h-6 text-qwaam-pink/70" />
                              )}
                            </button>
                            <input
                              ref={fileRefs[slot.key]}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoChange(slot.key, e)}
                              className="hidden"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={labelCls}>ملاحظات (اختياري)</label>
                    <textarea
                      rows={3}
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="كيف تشعرين هذا الأسبوع؟ ما الذي تحسّن وما الذي يحتاج عملاً؟"
                      className={`${inputCls} resize-none`}
                      disabled={isPending}
                    />
                  </div>

                  {/* Feedback */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-bold flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-bold flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isPending || anyPhotoUploading}
                    className="w-full py-4 rounded-2xl bg-qwaam-pink text-white font-black text-base shadow-lg shadow-qwaam-pink/20 hover:bg-pink-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ السجل'
                    )}
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
