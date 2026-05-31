import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiStatProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'from-card to-card/70 border-border/60',
  success: 'from-health-excellent/10 to-card/70 border-health-excellent/25',
  warning: 'from-health-warning/10 to-card/70 border-health-warning/25',
  danger: 'from-health-critical/10 to-card/70 border-health-critical/30',
};

const iconStyles = {
  default:
    'text-primary-foreground bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/25 ring-1 ring-primary/30',
  success: 'text-health-excellent bg-health-excellent/15 ring-1 ring-health-excellent/25',
  warning: 'text-health-warning bg-health-warning/15 ring-1 ring-health-warning/25',
  danger: 'text-health-critical bg-health-critical/15 ring-1 ring-health-critical/25',
};

const valueStyles = {
  default: 'text-foreground',
  success: 'text-health-excellent',
  warning: 'text-health-warning',
  danger: 'text-health-critical',
};

export function KpiStat({
  label,
  value,
  hint,
  icon: Icon,
  variant = 'default',
  className,
}: KpiStatProps) {
  return (
    <div
      className={cn(
        'glass-card group relative overflow-hidden rounded-xl border p-4 sm:p-5',
        'transition-[border-color,box-shadow,transform] duration-200 motion-reduce:transition-none',
        'hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10',
        'hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
        `bg-gradient-to-br ${variantStyles[variant]}`,
        className
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              'text-2xl font-bold tabular-nums sm:text-3xl',
              valueStyles[variant]
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
