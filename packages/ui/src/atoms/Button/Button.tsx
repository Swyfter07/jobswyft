import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger';

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state - shows spinner and disables interaction
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode;

  /**
   * Makes button full width
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Button component with multiple variants and sizes.
 * Supports loading state, icons, and follows the JobSwyft design system.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
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
          loading && styles.loading,
          fullWidth && styles.fullWidth,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-label="Loading">
            <svg
              className={styles.spinnerSvg}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className={styles.spinnerCircle}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={styles.spinnerPath}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {!loading && leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
