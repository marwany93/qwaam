'use client';

import { useRef, useState, useTransition } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';
import { updatePaymentScreenshot } from '@/actions/client-actions';
import {
  CurrencyDollarIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from '@heroicons/react/24/solid';

interface Props {
  amountPaid?: string | null;
  /** Pre-existing screenshot URL (so we can show a "already uploaded" state on first render). */
  initialScreenshotUrl?: string | null;
}

/**
 * Persistent banner shown at the top of the client dashboard while the
 * trainee's subscription status is still 'pending_payment'. Includes:
 *   - Payment instructions + transfer number
 *   - A "proof of payment" upload button so the admin can verify the transfer
 */
export default function PendingPaymentBanner({ amountPaid, initialScreenshotUrl }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialScreenshotUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [, startTx] = useTransition();
  const [error, setError] = useState('');

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so picking the same file again still triggers change
    e.target.value = '';
    if (!file) return;

    // Guardrails: 5 MB cap, image MIME only
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة فقط.');
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
    setUploading(true);

    try {
      // 1. Upload to Storage at payment_proofs/{uid}/{timestamp}.{ext}
      // Hierarchical path required by hardened Storage Rules: the {uid}
      // segment lets rules match on path components for ownership checks
      // (request.auth.uid == resource.name.split('/')[1]).
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `payment_proofs/${uid}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 2. Persist the URL to Firestore via server action
      startTx(async () => {
        const res = await updatePaymentScreenshot(url);
        if (res.success) {
          setUploadedUrl(url);
        } else {
          setError(res.error || 'فشل حفظ الرابط.');
        }
        setUploading(false);
      });
    } catch (err) {
      console.error('Upload failed:', err);
      setError('فشل رفع الصورة. حاولي مجدداً.');
      setUploading(false);
    }
  };

  return (
    <section
      dir="rtl"
      className="bg-gradient-to-r from-qwaam-yellow/20 via-qwaam-yellow/10 to-transparent border-2 border-qwaam-yellow rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden"
    >
      {/* Stripe accent on the right edge */}
      <div className="absolute top-0 right-0 w-1.5 h-full bg-qwaam-yellow" />

      <div className="flex items-start gap-4 relative">
        <div className="w-12 h-12 rounded-2xl bg-qwaam-yellow text-text-main flex items-center justify-center shrink-0 shadow-sm">
          <CurrencyDollarIcon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-black text-text-main text-base sm:text-lg">
              في انتظار تأكيد الدفع
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-wider">
              معلّقة
            </span>
          </div>

          <p className="text-sm font-bold text-text-main leading-relaxed">
            لإتمام تفعيل حسابك، يرجى تحويل
            {amountPaid && (
              <>
                {' '}
                <span className="text-qwaam-pink font-black" dir="ltr">{amountPaid} EGP</span>{' '}
              </>
            )}
            {!amountPaid && ' مبلغ الباقة '}
            عبر <span className="font-black">InstaPay</span> أو محفظة إلكترونية على الرقم:
          </p>

          <div className="mt-3 inline-flex items-center gap-3 bg-white border-2 border-dashed border-qwaam-pink rounded-xl px-4 py-2.5">
            <span className="text-xl sm:text-2xl font-black text-qwaam-pink tracking-wide select-all" dir="ltr">
              01001280161
            </span>
            <span className="text-[10px] font-bold text-text-muted leading-tight max-w-[120px]">
              اضغطي مطوّلاً للنسخ
            </span>
          </div>

          {/* ── Upload proof of payment ────────────────────── */}
          <div className="mt-5 pt-4 border-t border-qwaam-yellow/40">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            {uploadedUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-green-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  تم رفع الصورة، سيتم التأكيد قريباً
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-qwaam-pink hover:text-pink-600 transition-colors"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    عرض الصورة المرفوعة
                  </a>
                  <button
                    type="button"
                    onClick={handlePickFile}
                    disabled={uploading}
                    className="text-xs font-bold text-text-muted hover:text-text-main underline underline-offset-2 transition-colors"
                  >
                    استبدال الصورة
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted leading-relaxed">
                  بعد التحويل، ارفعي صورة من إيصال الدفع لتسريع التفعيل:
                </p>
                <button
                  type="button"
                  onClick={handlePickFile}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-qwaam-pink text-white font-black text-sm shadow-md shadow-qwaam-pink/20 hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      رفع صورة إيصال الدفع
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-700">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <p className="text-[11px] font-bold text-text-muted mt-3 leading-relaxed">
            سيتم تفعيل المحتوى تلقائياً بمجرد مراجعة المدرّب للتحويل.
          </p>
        </div>
      </div>
    </section>
  );
}
