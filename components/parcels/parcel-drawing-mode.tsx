'use client';

import { useState, useRef, useCallback } from 'react';
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { PenLine, MousePointerClick, Save, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPrompt } from './drawing/location-prompt';
import { DrawingToolbar, MetricsChip } from './drawing/drawing-toolbar';
import { useMapDrawing } from './drawing/use-map-drawing';
import { useLocationSetup } from './drawing/use-location-setup';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  SATELLITE_STYLE,
} from './drawing/drawing-constants';
import type { Polygon } from 'geojson';
import type { DrawingMetrics } from './drawing/drawing-types';

interface ParcelDrawingModeProps {
  onNext: (polygon: Polygon, metrics: DrawingMetrics) => void;
  onCancel?: () => void;
}

export function ParcelDrawingMode({ onNext, onCancel }: ParcelDrawingModeProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [polygonComplete, setPolygonComplete] = useState(false);

  const { activeTool, metrics, initDraw, setTool, undo, clear, getDrawnPolygon } =
    useMapDrawing({
      mapRef,
      onPolygonComplete: setPolygonComplete,
    });

  const { showLocationPrompt, setShowLocationPrompt, isLocating, handleUseGPS, handleLocationSearch } =
    useLocationSetup({ mapRef, mapReady });

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
    initDraw();
  }, [initDraw]);

  const handleNext = useCallback(() => {
    const polygon = getDrawnPolygon();
    if (!polygon || metrics.vertexCount < 3) return;
    onNext(polygon, metrics);
  }, [getDrawnPolygon, metrics, onNext]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
        <div className="flex items-center gap-2 mb-2 font-medium text-foreground">
          <Lightbulb className="h-4 w-4 text-primary" />
          Cómo marcar tu parcela
        </div>
        <ol className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <MousePointerClick className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            Hacé clic en cada esquina del lote
          </li>
          <li className="flex gap-2">
            <PenLine className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            Cerrá el polígono haciendo clic en el primer punto
          </li>
          <li className="flex gap-2">
            <Save className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            Pulsá Siguiente para completar nombre y cultivo
          </li>
        </ol>
      </div>

      <div className="relative rounded-xl border border-border overflow-hidden min-h-[320px] md:min-h-[420px]">
        {showLocationPrompt && (
          <LocationPrompt
            onUseGPS={handleUseGPS}
            onSearch={handleLocationSearch}
            onSkip={() => setShowLocationPrompt(false)}
            isLocating={isLocating}
          />
        )}

        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
          <DrawingToolbar
            activeTool={activeTool}
            onSetTool={setTool}
            onUndo={undo}
            onClear={clear}
          />
          {(metrics.areaHa > 0 || metrics.vertexCount > 0) && (
            <MetricsChip
              areaHa={metrics.areaHa}
              perimeterKm={metrics.perimeterKm}
              vertexCount={metrics.vertexCount}
            />
          )}
        </div>

        <Map
          ref={mapRef}
          mapStyle={SATELLITE_STYLE}
          initialViewState={{
            longitude: DEFAULT_MAP_CENTER.lng,
            latitude: DEFAULT_MAP_CENTER.lat,
            zoom: DEFAULT_MAP_ZOOM,
          }}
          style={{ width: '100%', height: '420px' }}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
        </Map>
      </div>

      <div className="flex flex-wrap gap-3 justify-between">
        {onCancel ? (
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={onCancel}>
            Cancelar
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          className="min-h-[44px] ml-auto"
          disabled={!polygonComplete || metrics.vertexCount < 3}
          onClick={handleNext}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
