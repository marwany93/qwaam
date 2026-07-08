'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

interface Props {
  trainedBefore?: boolean;
  previousGuidesPhotos?: string[];
}

/**
 * Coach-facing "registration info" card on the trainee detail page.
 * Surfaces the Issue #5 onboarding answers: whether the trainee has trained
 * before, and (if any) a thumbnail grid of their previous training-guide
 * photos with a full-screen lightbox. The assigned coach can read these
 * Storage URLs via the existing isAssignedCoach rule.
 */
export default function RegistrationCard({
  trainedBefore = false,
  previousGuidesPhotos = [],
}: Props) {
  const t = useTranslations('coach');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const photos = previousGuidesPhotos.filter(Boolean);

  return (
    <>
      <section
        dir="rtl"
        data-testid="coach-registration-card"
        className="bg-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20">
            <ClipboardDocumentCheckIcon className="w-5 h-5" />
          </span>
          <h3 className="text-lg font-black text-text-main">{t('registrationTitle')}</h3>
        </div>

        {/* Trained before? */}
        <div className="flex items-center justify-between gap-3 bg-gray-50/60 border border-border-light rounded-2xl px-4 py-3">
          <span className="text-sm font-bold text-text-muted">{t('trainedBeforeQuestion')}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black border ${trainedBefore
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-100 text-text-muted border-border-light'
              }`}
          >
            {trainedBefore ? t('trainedBeforeYes') : t('trainedBeforeNo')}
          </span>
        </div>

        {/* Previous-guide photos */}
        {trainedBefore && (
          <div data-testid="coach-guide-photos">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">
              {t('previousGuidesTitle')}
            </h4>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(url)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border-light bg-gray-100 group"
                    aria-label={`${t('previousGuidesTitle')} ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`guide-${i}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-text-muted">{t('noPreviousGuides')}</p>
            )}
          </div>
        )}
      </section>

      {/* Lightbox */}
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
            <img
              src={lightbox}
              alt="guide"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
