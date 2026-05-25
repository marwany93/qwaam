'use client';

import { useMemo, useState } from 'react';
import {
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type { ProgressEntry } from '@/types';

interface Props {
  entries: ProgressEntry[];
  /** Header label — defaults to "صور التقدم". */
  title?: string;
}

type Side = 'frontUrl' | 'sideUrl' | 'backUrl';

const SIDE_LABEL: Record<Side, string> = {
  frontUrl: 'أمامية',
  sideUrl:  'جانبية',
  backUrl:  'خلفية',
};

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const formatDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Privacy-first gallery for trainee progress photos.
 *
 * Security model:
 *   - Photos are served via Firebase Storage download URLs (short-lived,
 *     auth-required). The bucket is NOT public — see Storage Rules in
 *     /firestore.indexes.json / repo docs.
 *   - URL strings are passed through ProgressEntry.photos from the
 *     authenticated getProgressHistory() server action.
 *
 * UX:
 *   - All photos render BLURRED by default (privacy overlay). Trainee
 *     opts in to view by clicking the eye icon. Toggle is per-card so
 *     a coach showing a phone to a third party doesn't accidentally
 *     reveal more than one entry.
 *   - "Before & After" card at the top pairs the oldest + newest entries
 *     that have at least one photo. Reuses the same per-card blur state.
 *   - Click any unblurred photo to open it full-screen in a lightbox.
 */
export default function ProgressGallery({ entries, title = 'صور التقدم' }: Props) {
  // Only entries that actually have at least one photo
  const withPhotos = useMemo(
    () => entries.filter((e) =>
      e.photos?.frontUrl || e.photos?.sideUrl || e.photos?.backUrl,
    ),
    [entries],
  );

  // Per-entry blur toggle. Default: blurred. Map<entryId, isRevealed>.
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setRevealed((r) => ({ ...r, [id]: !r[id] }));

  // Lightbox state — when set, full-screen overlay shows the image
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  // ── Empty state ──────────────────────────────────────────
  if (withPhotos.length === 0) {
    return (
      <section
        dir="rtl"
        className="bg-white rounded-3xl border border-dashed border-border-light shadow-sm p-8 sm:p-10 text-center"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20 mb-3">
          <PhotoIcon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-text-main mb-1">{title}</h3>
        <p className="text-sm font-bold text-text-muted max-w-md mx-auto">
          لا توجد صور بعد. أضيفي صوراً عند تسجيل قياسك القادم لتتبّع تغيّرك بصرياً.
        </p>
      </section>
    );
  }

  // For "Before & After": oldest = end of array (history is DESC), newest = start
  const before = withPhotos[withPhotos.length - 1];
  const after = withPhotos[0];
  const showCompare = withPhotos.length >= 2 && before.id !== after.id;

  return (
    <>
      <section
        dir="rtl"
        className="bg-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20">
            <PhotoIcon className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-text-main">{title}</h3>
            <p className="text-xs font-bold text-text-muted">
              {withPhotos.length} جلسة تصوير · الصور مموّهة افتراضياً للخصوصية
            </p>
          </div>
        </div>

        {/* Before & After comparison (only with 2+ entries) */}
        {showCompare && (
          <div>
            <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">
              قبل وبعد
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <ComparisonCell entry={before} label="قبل" revealed={!!revealed[`cmp-${before.id}`]} onToggle={() => toggle(`cmp-${before.id}`)} onView={(u, l) => setLightbox({ url: u, label: l })} />
              <ComparisonCell entry={after}  label="بعد" revealed={!!revealed[`cmp-${after.id}`]}  onToggle={() => toggle(`cmp-${after.id}`)}  onView={(u, l) => setLightbox({ url: u, label: l })} />
            </div>
          </div>
        )}

        {/* Full history — every session that has photos */}
        <div>
          <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">
            سجل الصور الكامل
          </h4>
          <div className="space-y-4">
            {withPhotos.map((entry) => {
              const isRevealed = !!revealed[entry.id];
              return (
                <div key={entry.id} className="border border-border-light rounded-2xl p-4 bg-gray-50/40">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-black text-text-main">{formatDate(entry.date)}</p>
                    <button
                      type="button"
                      onClick={() => toggle(entry.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-qwaam-pink hover:text-pink-600 transition-colors"
                    >
                      {isRevealed ? (
                        <>
                          <EyeSlashIcon className="w-4 h-4" />
                          إخفاء
                        </>
                      ) : (
                        <>
                          <EyeIcon className="w-4 h-4" />
                          عرض
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['frontUrl', 'sideUrl', 'backUrl'] as Side[]).map((side) => {
                      const url = entry.photos?.[side];
                      const label = SIDE_LABEL[side];
                      return (
                        <PhotoTile
                          key={side}
                          url={url}
                          label={label}
                          revealed={isRevealed}
                          onClick={() => url && isRevealed && setLightbox({ url, label: `${label} · ${formatDate(entry.date)}` })}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox — full-screen view of a single photo */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.label} className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <p className="text-center text-white font-black text-sm mt-3" dir="rtl">{lightbox.label}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoTile({
  url, label, revealed, onClick,
}: { url?: string; label: string; revealed: boolean; onClick: () => void }) {
  if (!url) {
    return (
      <div className="aspect-square rounded-xl bg-gray-100 border border-dashed border-border-light flex items-center justify-center text-text-muted">
        <span className="text-[10px] font-bold">{label} —</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!revealed}
      className="relative aspect-square rounded-xl overflow-hidden border border-border-light bg-gray-100 group disabled:cursor-default"
      aria-label={revealed ? `عرض صورة ${label}` : `صورة ${label} مموّهة`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-300 ${
          revealed ? 'blur-0 scale-100 group-hover:scale-105' : 'blur-xl scale-110'
        }`}
      />
      {/* Tag */}
      <span className="absolute top-1 right-1 px-2 py-0.5 rounded-md bg-white/85 text-[10px] font-black text-text-main backdrop-blur-sm">
        {label}
      </span>
      {/* Privacy overlay when not revealed */}
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="px-2 py-1 rounded-lg bg-black/60 text-white text-[11px] font-black backdrop-blur-sm">
            مموّهة
          </span>
        </div>
      )}
    </button>
  );
}

function ComparisonCell({
  entry, label, revealed, onToggle, onView,
}: {
  entry: ProgressEntry;
  label: string;
  revealed: boolean;
  onToggle: () => void;
  onView: (url: string, label: string) => void;
}) {
  // Prefer front, fall back to side, then back
  const url =
    entry.photos?.frontUrl ||
    entry.photos?.sideUrl ||
    entry.photos?.backUrl;
  const dateLabel = formatDate(entry.date);

  return (
    <div className="rounded-2xl border border-border-light bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-l from-qwaam-pink-light/40 to-transparent">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
          <p className="text-xs font-black text-text-main">{dateLabel}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg text-qwaam-pink hover:bg-qwaam-pink-light transition-colors"
          aria-label={revealed ? 'إخفاء' : 'عرض'}
        >
          {revealed ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => url && revealed && onView(url, `${label} · ${dateLabel}`)}
        disabled={!url || !revealed}
        className="relative aspect-square w-full bg-gray-100 overflow-hidden disabled:cursor-default"
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              loading="lazy"
              className={`w-full h-full object-cover transition-all duration-300 ${
                revealed ? 'blur-0' : 'blur-xl scale-110'
              }`}
            />
            {!revealed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                <span className="px-2 py-1 rounded-lg bg-black/60 text-white text-[11px] font-black backdrop-blur-sm">
                  مموّهة
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs font-bold">
            لا توجد صورة
          </div>
        )}
      </button>
    </div>
  );
}
