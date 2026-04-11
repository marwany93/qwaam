// src/components/profile/ImagePreview.tsx
// 'use client' — handles click-to-lightbox interaction.
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Maximize2 } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  label: string;
  noImageLabel: string;
  viewFullLabel: string;
  closeLabel: string;
}

export default function ImagePreview({
  src,
  label,
  noImageLabel,
  viewFullLabel,
  closeLabel,
}: ImagePreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-2xl border-2 border-dashed border-border-light p-8 min-h-[180px]">
        <span className="text-4xl opacity-30">🖼️</span>
        <p className="text-sm font-bold text-text-muted">{noImageLabel}</p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div className="group relative overflow-hidden rounded-2xl border border-border-light shadow-sm cursor-pointer" onClick={() => setLightboxOpen(true)}>
        <div className="relative w-full aspect-[4/3] bg-gray-100">
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-text-main font-bold text-xs px-3 py-2 rounded-full flex items-center gap-1.5 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5" />
            {viewFullLabel}
          </div>
        </div>
        {/* Label badge */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
          <p className="text-white font-bold text-sm">{label}</p>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label={closeLabel}
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative max-w-4xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={label}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-center text-white/70 font-bold text-sm mt-3">{label}</p>
          </div>
        </div>
      )}
    </>
  );
}
