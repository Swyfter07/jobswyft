import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const X = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
));

X.displayName = 'X';
