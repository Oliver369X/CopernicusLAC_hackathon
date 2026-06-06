'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { area, centroid, length, lineString, polygon as turfPolygon } from '@turf/turf';
import type { Polygon } from 'geojson';
import type { DrawingMetrics, DrawTool } from './drawing-types';
import { DRAW_STYLES } from './drawing-constants';

interface UseMapDrawingProps {
  mapRef: React.RefObject<MapRef | null>;
  onPolygonComplete: (complete: boolean) => void;
}

type DrawControlMap = {
  addControl: (control: MapboxDraw) => void;
  removeControl: (control: MapboxDraw) => void;
  on: (event: string, handler: () => void) => void;
};

export function useMapDrawing({ mapRef, onPolygonComplete }: UseMapDrawingProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>('draw_polygon');
  const [metrics, setMetrics] = useState<DrawingMetrics>({
    areaHa: 0,
    perimeterKm: 0,
    centroid: null,
    vertexCount: 0,
  });

  const updateMetrics = useCallback(() => {
    if (!drawRef.current) return;
    const all = drawRef.current.getAll();
    const feature = all.features[0];
    if (!feature || feature.geometry.type !== 'Polygon') {
      setMetrics({ areaHa: 0, perimeterKm: 0, centroid: null, vertexCount: 0 });
      onPolygonComplete(false);
      return;
    }

    const coords = feature.geometry.coordinates[0] as [number, number][];
    const poly = turfPolygon([coords]);
    const areaHa = area(poly) / 10000;
    const perimeterKm = length(lineString(coords), { units: 'kilometers' });
    const cent = centroid(poly);
    const centroidCoords = cent.geometry.coordinates as [number, number];
    const vertexCount = Math.max(0, coords.length - 1);

    setMetrics({ areaHa, perimeterKm, centroid: centroidCoords, vertexCount });
    onPolygonComplete(vertexCount >= 3);
  }, [onPolygonComplete]);

  const initDraw = useCallback(() => {
    const map = mapRef.current?.getMap() as DrawControlMap | undefined;
    if (!map || drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: DRAW_STYLES,
      defaultMode: 'draw_polygon',
    });

    map.addControl(draw);
    drawRef.current = draw;

    map.on('draw.create', updateMetrics);
    map.on('draw.update', updateMetrics);
    map.on('draw.render', updateMetrics);
    map.on('draw.delete', () => {
      updateMetrics();
      onPolygonComplete(false);
    });

    draw.changeMode('draw_polygon');
  }, [mapRef, updateMetrics, onPolygonComplete]);

  useEffect(() => {
    return () => {
      const map = mapRef.current?.getMap() as DrawControlMap | undefined;
      if (map && drawRef.current) {
        try {
          map.removeControl(drawRef.current);
        } catch {
          /* map already destroyed */
        }
        drawRef.current = null;
      }
    };
  }, [mapRef]);

  const setTool = useCallback((tool: DrawTool) => {
    setActiveTool(tool);
    drawRef.current?.changeMode(
      (tool === 'draw_polygon' ? 'draw_polygon' : 'simple_select') as 'draw_polygon'
    );
  }, []);

  const undo = useCallback(() => {
    drawRef.current?.trash();
    updateMetrics();
  }, [updateMetrics]);

  const clear = useCallback(() => {
    drawRef.current?.deleteAll();
    onPolygonComplete(false);
    setMetrics({ areaHa: 0, perimeterKm: 0, centroid: null, vertexCount: 0 });
  }, [onPolygonComplete]);

  const getDrawnPolygon = useCallback((): Polygon | null => {
    const all = drawRef.current?.getAll();
    const geom = all?.features[0]?.geometry;
    if (!geom || geom.type !== 'Polygon') return null;
    return geom;
  }, []);

  return {
    activeTool,
    metrics,
    initDraw,
    setTool,
    undo,
    clear,
    getDrawnPolygon,
  };
}
