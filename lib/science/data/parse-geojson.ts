import type { GroundTruthRow } from './types';
import type { ScienceCropId } from '../types';

interface GeoFeature {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: { type: string; coordinates?: number[] };
}

interface GeoCollection {
  type: string;
  features?: GeoFeature[];
}

function propStr(props: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = props[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return undefined;
}

export function parseAgroforestryGeoJson(text: string): GroundTruthRow[] {
  const geo = JSON.parse(text) as GeoCollection;
  if (geo.type !== 'FeatureCollection' || !geo.features) return [];

  const rows: GroundTruthRow[] = [];
  for (const f of geo.features) {
    const props = f.properties ?? {};
    const coords = f.geometry?.coordinates;
    const crop = (propStr(props, 'crop', 'Crop') ?? 'coffee') as ScienceCropId;
    if (!['coffee', 'cacao'].includes(crop)) continue;

    rows.push({
      crop: crop as ScienceCropId,
      fieldId: propStr(props, 'field_id', 'fieldId') ?? '',
      capturedAt: propStr(props, 'captured_at', 'date') ?? new Date().toISOString(),
      lat: coords?.[1] ?? (props.lat != null ? Number(props.lat) : undefined),
      lng: coords?.[0] ?? (props.lng != null ? Number(props.lng) : undefined),
      productionClass: propStr(props, 'production_class', 'class'),
      source: propStr(props, 'source') ?? 'geojson',
      notes: propStr(props, 'notes'),
      raw: props,
    });
  }
  return rows;
}
