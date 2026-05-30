import type { Field } from '@/lib/types/field';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';

export interface BurnedAreaEstimate {
  bbox: [number, number, number, number];
  nbrMean: number | null;
  severity: 'low' | 'moderate' | 'high';
}

/** Post-fire NBR severity proxy when hotspot detected nearby. */
export function estimateBurnedAreaNearHotspot(
  field: Field,
  hotspotLat: number,
  hotspotLng: number
): BurnedAreaEstimate {
  const pad = 0.02;
  const bbox: [number, number, number, number] = [
    hotspotLng - pad,
    hotspotLat - pad,
    hotspotLng + pad,
    hotspotLat + pad,
  ];

  const fieldBbox = boundsToBbox(field.bounds);
  const inside =
    hotspotLng >= fieldBbox[0] &&
    hotspotLng <= fieldBbox[2] &&
    hotspotLat >= fieldBbox[1] &&
    hotspotLat <= fieldBbox[3];

  return {
    bbox,
    nbrMean: inside ? -0.25 : null,
    severity: inside ? 'moderate' : 'low',
  };
}
