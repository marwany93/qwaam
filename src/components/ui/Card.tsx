/**
 * Card — Reusable UI Component
 *
 * A flexible card component with Qwaam's glassmorphism dark theme.
 * Supports hover effects, optional header/footer, and size variants.
 */
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: ReactNode;
  /** Optional title shown at the top */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Enable the hover lift + glow animation */
  interactive?: boolean;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  title,
  subtitle,
  interactive = false,
  size = 'md',
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-white/5
        ${sizeStyles[size]}
        ${interactive
          ? 'hover:border-accent/30 hover:-translate-y-1 hover:shadow-[0_0_32px_rgba(233,69,96,0.15)] cursor-pointer'
          : ''
        }
        transition-all duration-300
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-surface))',
        boxShadow: 'var(--shadow-card)',
      }}
      {...rest}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-bold text-lg text-text-primary">{title}</h3>}
          {subtitle && <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
