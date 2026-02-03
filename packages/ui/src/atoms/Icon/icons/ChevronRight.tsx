import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ChevronRight = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
));

ChevronRight.displayName = 'ChevronRight';
