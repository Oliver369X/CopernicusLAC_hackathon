'use client';

import type { ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AlertChannelRowProps {
  icon: ReactNode;
  name: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function AlertChannelRow({
  icon,
  name,
  description,
  enabled,
  onToggle,
  disabled,
}: AlertChannelRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between',
        disabled && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground sm:text-base">{name}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          className={cn(
            'text-sm font-medium',
            enabled ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {enabled ? 'Activado' : 'Desactivado'}
        </span>
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
      </div>
    </div>
  );
}
