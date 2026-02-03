import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant
   * @default 'info'
   */
  variant?: 'success' | 'info' | 'purple' | 'warning' | 'danger';

  /**
   * Badge size
   * @default 'md'
   */
  size?: 'sm' | 'md';
}

/**
 * Badge component for status indicators and labels.
 * Follows JobSwyft design system.
 */
export const Badge = ({ variant = 'info', size = 'md', className, children, ...props }: BadgeProps) => {
  return (
    <span className={cn(styles.badge, styles[variant], styles[size], className)} {...props}>
      {children}
    </span>
  );
};
