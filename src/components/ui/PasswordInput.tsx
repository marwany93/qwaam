import React, { useState, forwardRef } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    // Using base utility styles typically found in inputCls
    const baseClasses = `w-full px-4 py-4 rounded-xl border-2 outline-none transition-all font-medium bg-gray-50/50`;
    const stateClasses = error
      ? 'border-red-400 bg-red-50/30 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
      : 'border-border-light focus:border-qwaam-pink focus:ring-0 text-text-main';

    return (
      <div className="relative" dir="ltr">
        <input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          dir="ltr"
          // We force padding-right explicitly (pr-12) to match right-absolute positioning
          // regardless of the exact parent rendering state, removing RTL ambiguity natively.
          className={`${baseClasses} ${stateClasses} text-left pr-12 tracking-widest ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((p) => !p)}
          className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-qwaam-pink transition-colors"
          aria-label="Toggle password visibility"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
