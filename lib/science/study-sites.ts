import { DEMO_SENTINEL_TILE } from '@/lib/geo/demo-region';
import type { ScienceCropId } from '@/lib/science/types';

export interface StudySite {
  fieldId: string;
  zoneId: string;
  crop: ScienceCropId;
  cohort: string;
  phenologyNote: string;
  sentinelTile: typeof DEMO_SENTINEL_TILE;
  groundTruthFocus: readonly string[];
}

export const STUDY_SITES: readonly StudySite[] = [
  {
    fieldId: 'field-sj-norte',
    zoneId: 'zone-sj-n-1',
    crop: 'soybean',
    cohort: 'SJ-2025-A',
    phenologyNote: 'R5–R6, biomasa alta',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['sano'],
  },
  {
    fieldId: 'field-sj-norte',
    zoneId: 'zone-sj-n-2',
    crop: 'soybean',
    cohort: 'SJ-2025-A',
    phenologyNote: 'R4–R5, riesgo roya temprana',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['roya_asiatica'],
  },
  {
    fieldId: 'field-sj-norte',
    zoneId: 'zone-sj-n-3',
    crop: 'soybean',
    cohort: 'SJ-2025-A',
    phenologyNote: 'R5, condición estable',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['sano'],
  },
  {
    fieldId: 'field-sj-norte',
    zoneId: 'zone-sj-n-4',
    crop: 'soybean',
    cohort: 'SJ-2025-A',
    phenologyNote: 'R3–R5, déficit hídrico leve',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['sequia', 'estres_hidrico'],
  },
  {
    fieldId: 'field-sj-norte',
    zoneId: 'zone-sj-n-5',
    crop: 'soybean',
    cohort: 'SJ-2025-A',
    phenologyNote: 'R5, recuperación post-sequía',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['recuperacion'],
  },
  {
    fieldId: 'field-sj-norte',
    zoneId: 'zone-sj-n-6',
    crop: 'soybean',
    cohort: 'SJ-2025-A',
    phenologyNote: 'R4, anomalía radar S1',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['anomalia_radar', 'humedad_suelo'],
  },
  {
    fieldId: 'field-sj-este',
    zoneId: 'zone-sj-e-1',
    crop: 'corn',
    cohort: 'SJ-2025-B',
    phenologyNote: 'VT–R1, dosel alto',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['sano'],
  },
  {
    fieldId: 'field-sj-este',
    zoneId: 'zone-sj-e-2',
    crop: 'corn',
    cohort: 'SJ-2025-B',
    phenologyNote: 'R1, mancha foliar gris',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['mancha_foliar_gris'],
  },
  {
    fieldId: 'field-sj-oeste',
    zoneId: 'zone-sj-w-1',
    crop: 'wheat',
    cohort: 'SJ-2025-C',
    phenologyNote: 'Espigado, roya y septoria',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['roya_amarilla', 'septoria'],
  },
  {
    fieldId: 'field-sj-sur',
    zoneId: 'zone-sj-s-1',
    crop: 'soybean',
    cohort: 'SJ-2025-D',
    phenologyNote: 'V2–V4, emergencia',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['emergencia'],
  },
  {
    fieldId: 'field-sj-sur',
    zoneId: 'zone-sj-s-2',
    crop: 'soybean',
    cohort: 'SJ-2025-D',
    phenologyNote: 'V3–V5, riesgo bacteriano',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['tizon_bacteriano'],
  },
  {
    fieldId: 'field-pf-soja',
    zoneId: 'zone-pf-soja',
    crop: 'soybean',
    cohort: 'PF-2025-A',
    phenologyNote: 'R3–R4, chacra familiar 8 ha',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['vigor_estable'],
  },
  {
    fieldId: 'field-pf-maiz',
    zoneId: 'zone-pf-maiz',
    crop: 'corn',
    cohort: 'PF-2025-B',
    phenologyNote: 'V8–VT, parcela 6 ha',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['sano'],
  },
  {
    fieldId: 'field-pf-trigo',
    zoneId: 'zone-pf-trigo',
    crop: 'wheat',
    cohort: 'PF-2025-C',
    phenologyNote: 'Espigado temprano, alerta roya',
    sentinelTile: DEMO_SENTINEL_TILE,
    groundTruthFocus: ['roya_temprana'],
  },
] as const;

export function getStudySite(
  fieldId: string,
  zoneId: string
): StudySite | undefined {
  return STUDY_SITES.find(
    (s) => s.fieldId === fieldId && s.zoneId === zoneId
  );
}

export function listStudySitesByCrop(crop: ScienceCropId): StudySite[] {
  return STUDY_SITES.filter((s) => s.crop === crop);
}
