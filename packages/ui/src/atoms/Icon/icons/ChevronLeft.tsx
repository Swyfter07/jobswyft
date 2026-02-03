import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ChevronLeft = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <polyline points="15 18 9 12 15 6" />
  </Icon>
));

ChevronLeft.displayName = 'ChevronLeft';
