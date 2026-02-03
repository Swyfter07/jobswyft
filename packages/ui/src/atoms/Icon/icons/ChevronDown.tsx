import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ChevronDown = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
));

ChevronDown.displayName = 'ChevronDown';
