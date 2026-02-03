import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Target = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </Icon>
));

Target.displayName = 'Target';
