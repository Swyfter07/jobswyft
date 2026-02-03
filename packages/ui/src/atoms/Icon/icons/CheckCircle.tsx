import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const CheckCircle = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Icon>
));

CheckCircle.displayName = 'CheckCircle';
