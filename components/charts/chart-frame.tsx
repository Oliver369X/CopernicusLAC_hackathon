'use client';

import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartFrameProps {
  children: ReactElement;
  className?: string;
  heightClassName?: string;
  'aria-label'?: string;
}

export function ChartFrame({
  children,
  className,
  heightClassName = 'min-h-[180px] h-[45vw] max-h-[280px] sm:min-h-[220px] sm:h-[300px] sm:max-h-[320px] w-full min-w-0',
  'aria-label': ariaLabel,
}: ChartFrameProps) {
  return (
    <div
      className={cn(heightClassName, className)}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
