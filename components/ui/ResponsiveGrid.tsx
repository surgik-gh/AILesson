'use client';

import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

/**
 * Responsive grid component with customizable column counts per breakpoint
 */
export function ResponsiveGrid({
  children,
  className = '',
  cols = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 4,
}: ResponsiveGridProps) {
  const gridClasses = [
    'grid',
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={gridClasses}>{children}</div>;
}
