// src/components/profile/InfoCard.tsx
// Reusable section card with a titled header and slot for any content.
import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
}

export function InfoCard({ title, icon: Icon, iconColor = 'text-qwaam-pink', children }: InfoCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light bg-gray-50/60">
        <div className={`w-9 h-9 rounded-2xl bg-qwaam-pink-light flex items-center justify-center shrink-0 border border-qwaam-pink/15`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className="font-black text-base text-text-main">{title}</h2>
      </div>
      {/* Card Body */}
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── InfoRow: single labeled field row ─────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value?: string | number | null;
  fallback?: string;
}

export function InfoRow({ label, value, fallback = '—' }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border-light last:border-0">
      <span className="text-sm font-bold text-text-muted shrink-0">{label}</span>
      <span className="text-sm font-extrabold text-text-main text-end">
        {value !== undefined && value !== null && value !== '' ? value : fallback}
      </span>
    </div>
  );
}

// ── Badge: chip/tag for arrays (e.g., chronic diseases, supplements) ──────────
interface BadgeProps {
  label: string;
  variant?: 'pink' | 'yellow' | 'red' | 'green' | 'gray';
}

const VARIANT_CLS: Record<NonNullable<BadgeProps['variant']>, string> = {
  pink: 'bg-qwaam-pink-light text-qwaam-pink border-qwaam-pink/20',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  gray: 'bg-gray-100 text-text-muted border-border-light',
};

export function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${VARIANT_CLS[variant]}`}>
      {label}
    </span>
  );
}

// ── ProfileSkeleton: full-page loading skeleton ───────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-3xl p-8 border border-border-light">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded-xl w-48" />
            <div className="h-4 bg-gray-200 rounded-xl w-64" />
            <div className="h-4 bg-gray-200 rounded-xl w-40" />
          </div>
        </div>
      </div>
      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-3xl border border-border-light overflow-hidden">
          <div className="h-16 bg-gray-100 border-b border-border-light" />
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex justify-between py-2 border-b border-border-light">
                <div className="h-4 bg-gray-200 rounded-xl w-24" />
                <div className="h-4 bg-gray-200 rounded-xl w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
