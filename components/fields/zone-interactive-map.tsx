'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Field, FieldZone } from '@/lib/types/field';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';
import {
  buildSatelliteDataFromMetrics,
  type NdviGridPayload,
} from '@/lib/data/satellite-from-metrics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MousePointerClick } from 'lucide-react';
import {
  cellCenterLatLng,
  copernicusTileUrl,
  esriWorldImageryUrl,
  neighborhoodAverage,
  ndviToColor,
  type PatchSelection,
} from '@/lib/geo/patch-selection';
import { PatchAnalysisDialog } from '@/components/fields/patch-analysis-dialog';

type MapLayer = 'ndre' | 'truecolor';

interface ZoneInteractiveMapProps {
  field: Field;
  zone: FieldZone;
  height?: number;
  onPatchSelect?: (patch: PatchSelection) => void;
}

interface MetricsResponse {
  metrics: {
    ndvi: number;
    ndmi: number;
    sceneDate?: string | null;
  };
  ndviGrid?: NdviGridPayload | null;
  source?: string;
  satelliteSource?: string;
}

export function ZoneInteractiveMap({
  field,
  zone,
  height = 240,
  onPatchSelect,
}: ZoneInteractiveMapProps) {
  const [layer, setLayer] = useState<MapLayer>('ndre');
  const [loading, setLoading] = useState(true);
  const [ndviGrid, setNdviGrid] = useState<number[][]>([]);
  const [ndmiGrid, setNdmiGrid] = useState<number[][]>([]);
  const [isRealGrid, setIsRealGrid] = useState(false);
  const [sceneDate, setSceneDate] = useState<string | null>(null);
  const [copernicusOk, setCopernicusOk] = useState(false);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [patch, setPatch] = useState<PatchSelection | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const bounds = zone.bounds;

  const baseImageUrl = useMemo(() => esriWorldImageryUrl(bounds, 640, 360), [bounds]);

  const overlayUrl = useMemo(
    () => copernicusTileUrl(bounds, layer, 640, 360),
    [bounds, layer]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/fields/${field.id}/metrics?zoneId=${encodeURIComponent(zone.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MetricsResponse | null) => {
        if (cancelled || !data) return;
        const built = buildSatelliteDataFromMetrics(
          field.id,
          {
            ndvi: data.metrics.ndvi,
            ndmi: data.metrics.ndmi,
            temperature: zone.temperatureAverage,
            soilMoisture: zone.soilMoistureAverage,
            sceneDate: data.metrics.sceneDate,
          },
          28,
          data.ndviGrid ?? null,
          { satelliteSource: data.satelliteSource, allowSyntheticGrid: true }
        );
        setNdviGrid(built.ndvi);
        setNdmiGrid(built.ndmi);
        setIsRealGrid(Boolean(built.isRealGrid));
        setSceneDate(data.metrics.sceneDate ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [field.id, zone.id, zone.temperatureAverage, zone.soilMoistureAverage]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!ndviGrid.length) return;
      const ndvi = ndviGrid[row]?.[col] ?? 0;
      const ndmi = ndmiGrid[row]?.[col] ?? 0;
      const { lat, lng } = cellCenterLatLng(row, col, ndviGrid.length, bounds);
      const selection: PatchSelection = {
        row,
        col,
        ndvi,
        ndmi,
        ndviAvg3: neighborhoodAverage(ndviGrid, row, col),
        lat,
        lng,
      };
      setSelected({ row, col });
      setPatch(selection);
      setDialogOpen(true);
      onPatchSelect?.(selection);
    },
    [ndviGrid, ndmiGrid, bounds, onPatchSelect]
  );

  const gridSize = ndviGrid.length;
  const viewW = 640;
  const viewH = 360;
  const pad = 8;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MousePointerClick className="h-3.5 w-3.5 text-primary" />
          Tocá un cuadro del mapa para analizar solo esa parte
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={layer === 'ndre' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setLayer('ndre')}
          >
            NDRE
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layer === 'truecolor' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setLayer('truecolor')}
          >
            Color real
          </Button>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-black/40"
        style={{ height }}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Imagen satelital base (Esri) */}
        <img
          src={baseImageUrl}
          alt="Imagen satelital de la parcela"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* Capa Copernicus opcional */}
        <img
          src={overlayUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity ${
            copernicusOk ? 'opacity-65' : 'opacity-0'
          }`}
          draggable={false}
          onLoad={() => setCopernicusOk(true)}
          onError={() => setCopernicusOk(false)}
        />

        {/* Grilla NDVI interactiva */}
        {gridSize > 0 && (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${viewW} ${viewH}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Mapa NDVI interactivo — seleccioná un punto"
          >
            {ndviGrid.map((row, y) =>
              row.map((ndvi, x) => {
                const cellW = (viewW - pad * 2) / gridSize;
                const cellH = (viewH - pad * 2) / gridSize;
                const isSel = selected?.row === y && selected?.col === x;
                return (
                  <rect
                    key={`c-${x}-${y}`}
                    x={pad + x * cellW}
                    y={pad + y * cellH}
                    width={cellW}
                    height={cellH}
                    fill={ndviToColor(ndvi)}
                    fillOpacity={isSel ? 0.55 : 0.28}
                    stroke={isSel ? '#ffffff' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isSel ? 2.5 : 0.5}
                    className="cursor-crosshair"
                    onClick={() => handleCellClick(y, x)}
                  />
                );
              })
            )}
            {/* Contorno de la zona */}
            <polygon
              points={boundsToPolygonPoints(bounds, viewW, viewH, pad)}
              fill="none"
              stroke="#16b57d"
              strokeWidth={2}
              strokeOpacity={0.9}
              pointerEvents="none"
            />
          </svg>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="font-normal">
          Imagen Esri World Imagery
        </Badge>
        {copernicusOk && (
          <Badge variant="secondary" className="font-normal">
            Copernicus S2 · {layer.toUpperCase()}
          </Badge>
        )}
        {isRealGrid && (
          <Badge variant="secondary" className="font-normal">
            Grilla real S2
          </Badge>
        )}
      </div>

      <PatchAnalysisDialog
        patch={patch}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zoneName={zone.name}
        sceneDate={sceneDate}
        isRealGrid={isRealGrid}
      />
    </div>
  );
}

function boundsToPolygonPoints(
  bounds: FieldZone['bounds'],
  width: number,
  height: number,
  padding: number
): string {
  const [west, south, east, north] = boundsToBbox(bounds);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scaleX = (lng: number) => padding + ((lng - west) / (east - west)) * innerW;
  const scaleY = (lat: number) => padding + ((north - lat) / (north - south)) * innerH;
  return bounds
    .map((p) => `${scaleX(p.lng)},${scaleY(p.lat)}`)
    .join(' ');
}
