import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricProgressRowProps {
  label: ReactNode;
  valueLabel?: string;
  percent: number;
  barClassName?: string;
  barStyle?: CSSProperties;
  className?: string;
  trailing?: ReactNode;
}

export function MetricProgressRow({
  label,
  valueLabel,
  percent,
  barClassName,
  barStyle,
  className,
  trailing,
}: MetricProgressRowProps) {
  const width = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {valueLabel && (
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {valueLabel}
            </span>
          )}
          {trailing}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none', barClassName)}
          style={{ width: `${width}%`, ...barStyle }}
        />
      </div>
    </div>
  );
}
