import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const MoreVertical = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </Icon>
));

MoreVertical.displayName = 'MoreVertical';
