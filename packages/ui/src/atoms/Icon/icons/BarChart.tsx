import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const BarChart = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </Icon>
));

BarChart.displayName = 'BarChart';
