import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import styles from './GlassCard.module.css';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Glass effect variant
   * @default 'subtle'
   */
  variant?: 'subtle' | 'medium' | 'strong' | 'frosted' | 'transparent';

  /**
   * Card content
   */
  children: ReactNode;

  /**
   * Add border
   * @default true
   */
  border?: boolean;
}

/**
 * GlassCard - Demonstrating different levels of glassmorphism effects
 *
 * CSS Properties used:
 * - background: rgba() with alpha transparency
 * - backdrop-filter: blur() for glass effect
 * - box-shadow: for depth
 * - border: subtle borders for definition
 */
export const GlassCard = ({
  variant = 'subtle',
  children,
  border = true,
  className,
  ...props
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        styles.card,
        styles[variant],
        border && styles.bordered,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
