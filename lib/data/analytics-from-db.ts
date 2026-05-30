import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import { getLatestSatelliteForZones } from '@/lib/data/zone-satellite-metrics';

export interface AnalyticsSummary {
  fieldCount: number;
  avgNdvi: number;
  avgNdre: number | null;
  healthDistribution: Record<string, number>;
  fields: Array<{
    id: string;
    name: string;
    crop: string;
    ndvi: number;
    ndre: number | null;
    health: string;
    riskScore: number;
  }>;
  climateViability: Array<{
    fieldId: string;
    viabilityScore: number | null;
    projectionYear: number | null;
  }>;
}

export async function buildAnalyticsSummary(
  service: DbClient | null,
  fields: Field[]
): Promise<AnalyticsSummary> {
  const zoneIds = fields.flatMap((f) => f.zones.map((z) => z.id));
  const satMap = service
    ? await getLatestSatelliteForZones(service, zoneIds)
    : new Map();

  const healthDistribution: Record<string, number> = {
    excellent: 0,
    good: 0,
    warning: 0,
    critical: 0,
  };

  let ndviSum = 0;
  let ndreSum = 0;
  let ndreCount = 0;

  const fieldSummaries = fields.map((field) => {
    healthDistribution[field.overallHealth] =
      (healthDistribution[field.overallHealth] ?? 0) + 1;

    const zoneNdvis = field.zones.map((z) => satMap.get(z.id)?.ndvi ?? z.ndviAverage);
    const avgFieldNdvi = zoneNdvis.reduce((a, b) => a + b, 0) / zoneNdvis.length;
    ndviSum += avgFieldNdvi;

    const ndreValues = field.zones
      .map((z) => satMap.get(z.id)?.ndre)
      .filter((v): v is number => v != null);
    const avgNdre =
      ndreValues.length > 0
        ? ndreValues.reduce((a, b) => a + b, 0) / ndreValues.length
        : null;
    if (avgNdre != null) {
      ndreSum += avgNdre;
      ndreCount++;
    }

    return {
      id: field.id,
      name: field.name,
      crop: field.crop,
      ndvi: avgFieldNdvi,
      ndre: avgNdre,
      health: field.overallHealth,
      riskScore: field.riskScore,
    };
  });

  let climateViability: AnalyticsSummary['climateViability'] = [];
  if (service) {
    const { data } = await service
      .from('climate_readings')
      .select('field_id, viability_score, projection_year, captured_at')
      .order('captured_at', { ascending: false });

    const seen = new Set<string>();
    for (const row of data ?? []) {
      const fieldId = String(row.field_id);
      if (seen.has(fieldId)) continue;
      seen.add(fieldId);
      climateViability.push({
        fieldId,
        viabilityScore: row.viability_score != null ? Number(row.viability_score) : null,
        projectionYear: row.projection_year as number | null,
      });
    }
  }

  return {
    fieldCount: fields.length,
    avgNdvi: fields.length ? ndviSum / fields.length : 0,
    avgNdre: ndreCount ? ndreSum / ndreCount : null,
    healthDistribution,
    fields: fieldSummaries,
    climateViability,
  };
}
