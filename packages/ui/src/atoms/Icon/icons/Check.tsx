import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Check = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
));

Check.displayName = 'Check';
