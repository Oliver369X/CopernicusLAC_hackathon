/** Región operativa de la demo — corredor San Julián, Santa Cruz (Bolivia). */

export const DEMO_REGION_LABEL = 'San Julián, Santa Cruz — Bolivia';

export const DEMO_SENTINEL_TILE = '20KND' as const;

export const DEMO_REGION_BOUNDS = {
  west: -63.2,
  east: -62.1,
  south: -17.6,
  north: -16.0,
} as const;

export interface DemoFieldCenter {
  id: string;
  lat: number;
  lng: number;
}

export const DEMO_FIELD_CENTERS: readonly DemoFieldCenter[] = [
  { id: 'field-sj-norte', lat: -16.95, lng: -62.85 },
  { id: 'field-sj-este', lat: -17.05, lng: -62.55 },
  { id: 'field-sj-oeste', lat: -16.75, lng: -62.95 },
  { id: 'field-sj-sur', lat: -17.15, lng: -62.7 },
] as const;

/**
 * Valida si un punto cae dentro del ROI de demo (bbox San Julián),
 * no el departamento completo de Santa Cruz.
 */
export function isInDemoRegion(lat: number, lng: number): boolean {
  const { west, east, south, north } = DEMO_REGION_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

export function getDemoCenter(fieldId: string): DemoFieldCenter | undefined {
  return DEMO_FIELD_CENTERS.find((c) => c.id === fieldId);
}
