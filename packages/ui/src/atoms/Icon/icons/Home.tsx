import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Home = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
));

Home.displayName = 'Home';
