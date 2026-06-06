'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { DEMO_SENTINEL_TILE } from '@/lib/geo/demo-region';
import type { AnalysisProvenance } from '@/lib/science/types';

interface DataProvenanceBannerProps {
  provenance: AnalysisProvenance | null | undefined;
}

export function DataProvenanceBanner({ provenance }: DataProvenanceBannerProps) {
  if (!provenance) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
        <Badge variant="destructive" className="mr-2">
          Sin datos en DB — ejecutá cron o Actualizar satélite
        </Badge>
        <span className="text-muted-foreground">tile {DEMO_SENTINEL_TILE}</span>
      </div>
    );
  }

  const { dataSource, readingDate, sceneDate } = provenance;

  let badge: ReactNode;
  if (dataSource === 'database') {
    badge = (
      <Badge className="mr-2 bg-emerald-600 hover:bg-emerald-600">
        Copernicus · lectura {readingDate}
      </Badge>
    );
  } else if (dataSource === 'live') {
    badge = (
      <Badge className="mr-2 bg-sky-600 hover:bg-sky-600">
        Actualizado hoy · escena {sceneDate ?? readingDate}
      </Badge>
    );
  } else {
    badge = (
      <Badge variant="destructive" className="mr-2">
        Sin datos en DB — ejecutá cron o Actualizar satélite
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-xs">
      {badge}
      <span className="text-muted-foreground shrink-0">tile {DEMO_SENTINEL_TILE}</span>
      {provenance.availableDates.length > 0 && (
        <span className="text-muted-foreground truncate">
          {provenance.availableDates.length} fechas en DB
        </span>
      )}
    </div>
  );
}
