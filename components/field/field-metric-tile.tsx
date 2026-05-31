import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldMetricTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
}

export function FieldMetricTile({ icon: Icon, label, value, iconClassName }: FieldMetricTileProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', iconClassName)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</p>
    </div>
  );
}
