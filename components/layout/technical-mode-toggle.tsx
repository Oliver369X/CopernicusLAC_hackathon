'use client';

import { FlaskConical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import { cn } from '@/lib/utils';

interface TechnicalModeToggleProps {
  collapsed?: boolean;
  className?: string;
}

export function TechnicalModeToggle({ collapsed = false, className }: TechnicalModeToggleProps) {
  const { canToggleTechnical, technicalMode, setTechnicalMode, loading } = usePlainExperience();

  if (loading || !canToggleTechnical) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setTechnicalMode(!technicalMode)}
        className={cn(
          'flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          technicalMode && 'text-primary',
          className
        )}
        aria-label={technicalMode ? 'Desactivar modo técnico' : 'Activar modo técnico'}
        title="Modo técnico (para agrónomos)"
      >
        <FlaskConical className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5',
        className
      )}
    >
      <div className="min-w-0">
        <Label htmlFor="technical-mode" className="text-xs font-medium cursor-pointer">
          Modo técnico
        </Label>
        <p className="text-[10px] text-muted-foreground truncate">Para agrónomos</p>
      </div>
      <Switch
        id="technical-mode"
        checked={technicalMode}
        onCheckedChange={setTechnicalMode}
        aria-label="Activar modo técnico para agrónomos"
      />
    </div>
  );
}
