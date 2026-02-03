import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Scan = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
));

Scan.displayName = 'Scan';
