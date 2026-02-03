import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ChevronUp = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <polyline points="18 15 12 9 6 15" />
  </Icon>
));

ChevronUp.displayName = 'ChevronUp';
