'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Field } from '@/lib/types/field';
import { Button } from '@/components/ui/button';

const SatelliteMap = dynamic(() => import('./satellite-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full rounded-lg border border-border bg-muted/30 animate-pulse" />
  ),
});

interface SatelliteMapPanelProps {
  field: Field;
}

export default function SatelliteMapPanel({ field }: SatelliteMapPanelProps) {
  const [layer, setLayer] = useState<'ndvi' | 'ndre' | 'truecolor'>('ndre');

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={layer === 'ndre' ? 'default' : 'outline'}
          onClick={() => setLayer('ndre')}
        >
          NDRE (S2)
        </Button>
        <Button
          size="sm"
          variant={layer === 'ndvi' ? 'default' : 'outline'}
          onClick={() => setLayer('ndvi')}
        >
          NDVI (S2)
        </Button>
        <Button
          size="sm"
          variant={layer === 'truecolor' ? 'default' : 'outline'}
          onClick={() => setLayer('truecolor')}
        >
          True Color (S2)
        </Button>
      </div>
      <SatelliteMap field={field} layer={layer} />
      <p className="text-xs text-muted-foreground">
        Imágenes vía Copernicus Data Space (Sentinel-2 L2A). Tokens en servidor.
      </p>
    </div>
  );
}
