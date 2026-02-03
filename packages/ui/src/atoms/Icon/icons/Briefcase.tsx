import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Briefcase = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Icon>
));

Briefcase.displayName = 'Briefcase';
