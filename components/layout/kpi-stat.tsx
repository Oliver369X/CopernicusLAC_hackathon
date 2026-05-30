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
  default: 'from-card to-card/70',
  success: 'from-emerald-950/40 to-card/70 border-emerald-500/20',
  warning: 'from-amber-950/30 to-card/70 border-amber-500/20',
  danger: 'from-red-950/40 to-card/70 border-red-500/25',
};

const iconStyles = {
  default: 'text-primary bg-primary/10',
  success: 'text-emerald-400 bg-emerald-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  danger: 'text-red-400 bg-red-500/10',
};

const valueStyles = {
  default: 'text-foreground',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
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
        'glass-card group relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        `bg-gradient-to-br ${variantStyles[variant]}`,
        className
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn('text-3xl font-bold tabular-nums', valueStyles[variant])}>
            {value}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            iconStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
