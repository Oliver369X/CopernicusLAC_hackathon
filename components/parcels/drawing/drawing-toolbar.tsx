'use client';

import { PenLine, Undo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DrawTool } from './drawing-types';
import { cn } from '@/lib/utils';

interface DrawingToolbarProps {
  activeTool: DrawTool;
  onSetTool: (tool: DrawTool) => void;
  onUndo: () => void;
  onClear: () => void;
}

export function DrawingToolbar({ activeTool, onSetTool, onUndo, onClear }: DrawingToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card/95 p-2 shadow-sm backdrop-blur">
      <Button
        type="button"
        size="sm"
        variant={activeTool === 'draw_polygon' ? 'default' : 'outline'}
        className="min-h-[44px]"
        onClick={() => onSetTool('draw_polygon')}
      >
        <PenLine className="h-4 w-4 mr-1" />
        Polígono
      </Button>
      <Button type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={onUndo}>
        <Undo2 className="h-4 w-4 mr-1" />
        Deshacer
      </Button>
      <Button type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={onClear}>
        <Trash2 className="h-4 w-4 mr-1" />
        Limpiar
      </Button>
    </div>
  );
}

export function MetricsChip({
  areaHa,
  perimeterKm,
  vertexCount,
}: {
  areaHa: number;
  perimeterKm: number;
  vertexCount: number;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur',
        'text-foreground'
      )}
    >
      <p>
        <span className="font-semibold">{areaHa.toFixed(2)} ha</span>
        <span className="text-muted-foreground"> · {perimeterKm.toFixed(2)} km perímetro</span>
      </p>
      <p className="text-muted-foreground">{vertexCount} vértices</p>
    </div>
  );
}
