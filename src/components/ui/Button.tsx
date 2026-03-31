/**
 * Button — Reusable UI Component
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(233,69,96,0.4)]',
  secondary: 'text-accent border border-accent/40 hover:bg-accent/10',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
  danger: 'text-white bg-error hover:bg-red-600',
};

const variantBg: Record<ButtonVariant, string | undefined> = {
  primary: 'linear-gradient(135deg, var(--color-accent), #f97316)',
  secondary: undefined,
  ghost: undefined,
  danger: undefined,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const bg = variantBg[variant];

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={bg ? { background: bg } : undefined}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
