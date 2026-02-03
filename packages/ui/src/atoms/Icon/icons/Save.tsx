import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Save = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </Icon>
));

Save.displayName = 'Save';
