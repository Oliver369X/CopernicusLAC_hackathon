import type { StyleSpecification } from 'maplibre-gl';

export const DEFAULT_MAP_CENTER = { lng: -62, lat: -17 };
export const DEFAULT_MAP_ZOOM = 12;

export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, Maxar',
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#e8eef4' } },
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      paint: { 'raster-opacity': 1 },
    },
    {
      id: 'labels',
      type: 'raster',
      source: 'labels',
      paint: { 'raster-opacity': 0.85 },
    },
  ],
};

/** MapLibre no interpreta variables CSS — usar hex (mismo verde que --aura-green). */
export const DRAW_ACCENT = '#16b57d';

export const DRAW_STYLES = [
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'fill-color': DRAW_ACCENT, 'fill-opacity': 0.25 },
  },
  {
    id: 'gl-draw-polygon-fill-static',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    paint: { 'fill-color': DRAW_ACCENT, 'fill-opacity': 0.15 },
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'line-color': DRAW_ACCENT,
      'line-width': 3,
      'line-dasharray': [2, 2],
    },
  },
  {
    id: 'gl-draw-polygon-stroke-static',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    paint: { 'line-color': DRAW_ACCENT, 'line-width': 2 },
  },
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 5, 'circle-color': DRAW_ACCENT, 'circle-opacity': 0.8 },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 12,
      'circle-color': '#16b57d33',
    },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 7,
      'circle-color': '#FFFFFF',
      'circle-stroke-color': DRAW_ACCENT,
      'circle-stroke-width': 2,
    },
  },
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    paint: {
      'line-color': DRAW_ACCENT,
      'line-width': 3,
      'line-dasharray': [4, 3],
    },
  },
];
