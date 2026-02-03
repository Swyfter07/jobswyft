import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Clock = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
));

Clock.displayName = 'Clock';
