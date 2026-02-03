import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Plus = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
));

Plus.displayName = 'Plus';
