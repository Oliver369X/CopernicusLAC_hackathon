import type { CropType } from '@/lib/mock-data/crops';
import { DEMO_FIELD_CENTERS } from '@/lib/geo/demo-region';
import { getDemoScenario } from '@/lib/integrations/geodata/demo-scenarios';
import type { Field, FieldZone, GeoBounds, GeoPoint } from '@/lib/types/field';
import type { ScienceCropId } from '@/lib/science/types';

const CROP_BY_FIELD: Record<string, ScienceCropId> = {
  'field-pf-soja': 'soybean',
  'field-pf-maiz': 'corn',
  'field-pf-trigo': 'wheat',
};

const ZONE_BY_FIELD: Record<string, string> = {
  'field-pf-soja': 'zone-pf-soja',
  'field-pf-maiz': 'zone-pf-maiz',
  'field-pf-trigo': 'zone-pf-trigo',
};

function boxAround(center: GeoPoint, delta = 0.005): GeoBounds {
  return [
    { lat: center.lat - delta, lng: center.lng - delta },
    { lat: center.lat - delta, lng: center.lng + delta },
    { lat: center.lat + delta, lng: center.lng + delta },
    { lat: center.lat + delta, lng: center.lng - delta },
  ];
}

/** Campos demo pequeña agricultora para el Lab (visibles en tour cooperativa). */
export function getDemoOverlayFields(crop: ScienceCropId): Field[] {
  return DEMO_FIELD_CENTERS.filter((c) => CROP_BY_FIELD[c.id] === crop)
    .map((center) => {
      const scenario = getDemoScenario(center.id);
      if (!scenario) return null;
      const zoneId = ZONE_BY_FIELD[center.id] ?? `zone-${center.id}`;
      const corners = boxAround(center);
      const zone: FieldZone = {
        id: zoneId,
        name: 'Parcela completa',
        fieldId: center.id,
        bounds: corners,
        crop: crop as CropType,
        area: scenario.areaHa,
        ndviAverage: 0.55,
        ndmiAverage: 0.4,
        temperatureAverage: 28,
        soilMoistureAverage: 68,
        observationCount: 4,
        diseaseRisks: [],
        health: 'good',
        lastObservation: new Date(),
        lastUpdate: new Date(),
      };
      const field: Field = {
        id: center.id,
        name: scenario.highlight.split(' · ')[0] ?? center.id,
        locationLabel: 'San Julián, Santa Cruz — Bolivia',
        center,
        bounds: corners,
        area: scenario.areaHa,
        crop: crop as CropType,
        plantedDate: new Date('2024-09-01'),
        daysFromPlanting: 45,
        zones: [zone],
        overallHealth: 'good',
        lastUpdate: new Date(),
        notifications: 0,
        riskScore: 35,
      };
      return field;
    })
    .filter((f): f is Field => f != null);
}

export function mergeLabDemoFields(fields: Field[], crop: ScienceCropId): Field[] {
  const ids = new Set(fields.map((f) => f.id));
  const overlays = getDemoOverlayFields(crop).filter((f) => !ids.has(f.id));
  return overlays.length ? [...fields, ...overlays] : fields;
}
