'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Field, FieldZone } from '@/lib/types/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_SENTINEL_TILE } from '@/lib/geo/demo-region';

const SatelliteMap = dynamic(() => import('./satellite-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full rounded-lg border border-border bg-muted/30 animate-pulse" />
  ),
});

interface SatelliteMapPanelProps {
  field: Field;
  selectedZoneId?: string | null;
  onZoneClick?: (zone: FieldZone) => void;
}

export default function SatelliteMapPanel({
  field,
  selectedZoneId,
  onZoneClick,
}: SatelliteMapPanelProps) {
  const [layer, setLayer] = useState<'ndvi' | 'ndre' | 'truecolor'>('ndre');

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Button
          size="sm"
          className="shrink-0"
          variant={layer === 'ndre' ? 'default' : 'outline'}
          onClick={() => setLayer('ndre')}
        >
          NDRE (S2)
        </Button>
        <Button
          size="sm"
          className="shrink-0"
          variant={layer === 'ndvi' ? 'default' : 'outline'}
          onClick={() => setLayer('ndvi')}
        >
          NDVI (S2)
        </Button>
        <Button
          size="sm"
          className="shrink-0"
          variant={layer === 'truecolor' ? 'default' : 'outline'}
          onClick={() => setLayer('truecolor')}
        >
          Color real (S2)
        </Button>
      </div>
      <SatelliteMap
        field={field}
        layer={layer}
        selectedZoneId={selectedZoneId}
        onZoneClick={onZoneClick}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs font-normal">
          Santa Cruz · tile {DEMO_SENTINEL_TILE} · San Julián
        </Badge>
        <p className="text-xs text-muted-foreground">
          Copernicus Data Space (Sentinel-2 L2A)
        </p>
      </div>
    </div>
  );
}
