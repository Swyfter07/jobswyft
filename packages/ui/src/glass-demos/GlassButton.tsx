import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import styles from './GlassButton.module.css';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Glass button variant
   * @default 'glass'
   */
  variant?: 'glass' | 'glass-border' | 'glass-solid' | 'glass-glow';

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * GlassButton - Button with glassmorphism effects
 *
 * Demonstrates:
 * - Transparent backgrounds with backdrop-filter
 * - Hover state transitions
 * - Border variations
 * - Glow effects
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'glass',
      size = 'md',
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
