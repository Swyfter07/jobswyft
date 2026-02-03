import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Eye = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
));

Eye.displayName = 'Eye';
