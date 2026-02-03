import { forwardRef, SVGAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface IconProps extends SVGAttributes<SVGElement> {
  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number;

  /**
   * Icon color (currentColor by default)
   */
  color?: string;

  /**
   * Stroke width
   * @default 2
   */
  strokeWidth?: number;

  /**
   * Additional className
   */
  className?: string;
}

/**
 * Base Icon component for SVG icons.
 * All icons inherit from this component.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, color = 'currentColor', strokeWidth = 2, className, children, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(className)}
        {...props}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';
