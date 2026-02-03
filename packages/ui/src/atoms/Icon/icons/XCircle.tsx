import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const XCircle = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </Icon>
));

XCircle.displayName = 'XCircle';
