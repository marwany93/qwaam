// src/components/onboarding/ui/FormField.tsx
// Reusable labeled input wrapper used across all onboarding steps.
'use client';

import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-text-main">
        {label}
        {required && <span className="text-qwaam-pink ms-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-text-muted font-medium">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 font-bold animate-in fade-in duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Shared input className ─────────────────────────────────────────────────────
export const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3.5 rounded-xl border-2 transition-all outline-none font-medium text-text-main bg-gray-50/50 text-sm ${
    hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-border-light focus:border-qwaam-pink'
  }`;

// ── BooleanToggle: Yes / No radio group ───────────────────────────────────────
interface BooleanToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
  yesLabel: string;
  noLabel: string;
}

export function BooleanToggle({ value, onChange, yesLabel, noLabel }: BooleanToggleProps) {
  return (
    <div className="flex gap-3">
      {[
        { label: yesLabel, val: true },
        { label: noLabel, val: false },
      ].map(({ label, val }) => (
        <button
          key={String(val)}
          type="button"
          onClick={() => onChange(val)}
          className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
            value === val
              ? 'bg-qwaam-pink text-white border-qwaam-pink shadow-md shadow-qwaam-pink/20'
              : 'bg-gray-50 text-text-muted border-border-light hover:border-qwaam-pink/50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── CheckboxItem ──────────────────────────────────────────────────────────────
interface CheckboxItemProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxItem({ id, label, checked, onChange }: CheckboxItemProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
        checked
          ? 'border-qwaam-pink bg-qwaam-pink-light text-qwaam-pink font-bold'
          : 'border-border-light bg-gray-50/50 text-text-muted hover:border-qwaam-pink/40'
      }`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          checked ? 'bg-qwaam-pink border-qwaam-pink' : 'border-gray-300'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm font-bold leading-tight">{label}</span>
    </label>
  );
}
