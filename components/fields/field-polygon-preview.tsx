'use client';

import { useMemo } from 'react';
import type { FieldZone, GeoBounds } from '@/lib/types/field';
import { boundsFromPoints } from '@/lib/geo/svg-bounds';
import { healthColors } from '@/lib/design/tokens';

interface FieldPolygonPreviewProps {
  bounds: GeoBounds;
  zones?: FieldZone[];
  height?: number;
  highlightZoneId?: string;
}

export function FieldPolygonPreview({
  bounds,
  zones,
  height = 160,
  highlightZoneId,
}: FieldPolygonPreviewProps) {
  const svg = useMemo(() => boundsFromPoints(bounds), [bounds]);

  const scaleY = height / svg.height;

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-border bg-muted/20"
      style={{ height }}
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svg.width} ${svg.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Vista previa del polígono"
      >
        <rect width={svg.width} height={svg.height} fill="var(--db-surface, #141a22)" />
        {zones?.length ? (
          zones.map((zone) => {
            const isHighlight = zone.id === highlightZoneId;
            const fill = healthColors[zone.health] ?? healthColors.good;
            return (
              <polygon
                key={zone.id}
                points={svg.polygonPoints(zone.bounds)}
                fill={fill}
                fillOpacity={isHighlight ? 0.35 : 0.18}
                stroke={fill}
                strokeWidth={isHighlight ? 3 : 1.5}
                strokeOpacity={0.9}
              />
            );
          })
        ) : (
          <polygon
            points={svg.polygonPoints(bounds)}
            fill="var(--aura-green, #16B57D)"
            fillOpacity={0.12}
            stroke="var(--aura-green, #16B57D)"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
}
