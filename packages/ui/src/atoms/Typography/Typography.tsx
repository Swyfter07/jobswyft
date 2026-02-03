import { HTMLAttributes, ElementType, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Typography.module.css';

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  /**
   * HTML element to render
   * @default 'p'
   */
  as?: ElementType;

  /**
   * Typography variant
   * @default 'body'
   */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'small' | 'xs';

  /**
   * Text color
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'success' | 'danger' | 'warning';

  /**
   * Font weight
   */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';

  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';

  children: ReactNode;
}

/**
 * Typography component for consistent text styling.
 * Follows JobSwyft design system.
 */
export const Typography = ({
  as,
  variant = 'body',
  color = 'primary',
  weight,
  align,
  className,
  children,
  ...props
}: TypographyProps) => {
  // Determine the HTML element based on variant or 'as' prop
  const Component = as || getDefaultElement(variant);

  return (
    <Component
      className={cn(
        styles.typography,
        styles[variant],
        styles[`color-${color}`],
        weight && styles[`weight-${weight}`],
        align && styles[`align-${align}`],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

function getDefaultElement(variant: TypographyProps['variant']): ElementType {
  switch (variant) {
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'h4':
      return 'h4';
    case 'small':
    case 'xs':
      return 'small';
    default:
      return 'p';
  }
}
