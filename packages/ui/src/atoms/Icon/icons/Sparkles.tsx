import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Sparkles = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="M12 3v18M3 12h18M6 6l12 12M6 18L18 6" />
  </Icon>
));

Sparkles.displayName = 'Sparkles';
