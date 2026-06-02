'use client';

import { useRef, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';

export type PhotoSide = 'front' | 'side' | 'back';

interface Props {
  /** Auth uid — used in the default storage path. */
  uid: string;
  /** Which body angle this upload represents — front/side/back. Defaults to 'front'. */
  side?: PhotoSide;
  /**
   * Override the storage path prefix. When provided the path becomes
   * `${pathPrefix}/${Date.now()}.{ext}` instead of the default
   * `progress_photos/{uid}/{timestamp}_{side}.{ext}`.
   * Example: `payment_proofs/${uid}`
   */
  pathPrefix?: string;
  /** Display label rendered above the tile (e.g., 'أمامية'). */
  label?: string;
  /** Currently-stored URL — if present, the tile renders a thumbnail with a checkmark. */
  currentUrl?: string;
  /** Disable the tile entirely (e.g., parent form is submitting). */
  disabled?: boolean;
  /** Fired after a successful upload + getDownloadURL. */
  onUploaded: (url: string, side: PhotoSide) => void;
  /** Fired on validation or upload failure. */
  onError?: (message: string) => void;
  /** Fired whenever the tile's internal uploading flag flips — lets the
   *  parent block its own submit button until in-flight uploads finish. */
  onUploadingChange?: (uploading: boolean, side: PhotoSide) => void;
}

/**
 * Single-tile photo upload. Path:
 *   progress_photos/{uid}/{timestamp}_{side}.{ext}
 *
 * The hierarchical `/{uid}/` segment is what the hardened Storage Rules
 * match against — the rule reads request.auth.uid == path's {userId}.
 *
 * All reads/writes flow through the authenticated Firebase SDK — the
 * download URL is short-lived signed, and the storage bucket itself
 * remains private. No public ACLs are ever set.
 */
export default function PhotoUpload({
  uid, side = 'front', pathPrefix, label, currentUrl, disabled,
  onUploaded, onError, onUploadingChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => fileRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so re-picking the same file still fires `change`
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('يجب اختيار صورة فقط.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('حجم الصورة يجب أن يكون أقل من 5 ميجابايت.');
      return;
    }
    if (!uid) {
      onError?.('انتهت الجلسة. أعيدي تسجيل الدخول.');
      return;
    }

    setUploading(true);
    onUploadingChange?.(true, side);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = pathPrefix
        ? `${pathPrefix}/${Date.now()}.${ext}`
        : `progress_photos/${uid}/${Date.now()}_${side}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onUploaded(url, side);
    } catch (err) {
      console.error(`[PhotoUpload:${side}] failed`, err);
      onError?.('فشل رفع الصورة. حاولي مجدداً.');
    } finally {
      setUploading(false);
      onUploadingChange?.(false, side);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-[11px] font-black text-text-muted text-center">{label}</p>
      )}
      <button
        type="button"
        onClick={handlePick}
        disabled={uploading || disabled}
        className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-qwaam-pink/40 bg-qwaam-pink-light/20 hover:bg-qwaam-pink-light/40 transition-all overflow-hidden flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {currentUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt={label ?? side} className="w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-md">
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </span>
          </>
        ) : uploading ? (
          <span className="w-6 h-6 border-2 border-qwaam-pink border-t-transparent rounded-full animate-spin" />
        ) : (
          <ArrowUpTrayIcon className="w-6 h-6 text-qwaam-pink/70" />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
