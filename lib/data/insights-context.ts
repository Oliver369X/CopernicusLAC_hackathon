import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import { buildAnalyticsSummary } from '@/lib/data/analytics-from-db';
import {
  getLatestSatelliteForZones,
  getLatestWeatherForField,
} from '@/lib/data/zone-satellite-metrics';
import { getCropProfile } from '@/lib/mock-data/crops';

export interface ZoneInsightRow {
  zoneId: string;
  zoneName: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  ndvi: number;
  ndmi: number;
  ndre: number | null;
  s1MoistureIndex: number | null;
  s3Lst: number | null;
  soilMoisture: number | null;
  temperature: number | null;
  source: string;
  sceneDate: string | null;
  diseaseRisks: string[];
}

export interface InsightsContextPayload {
  source: 'satellite_readings' | 'zones_seed' | 'empty';
  zones: ZoneInsightRow[];
  correlationData: Array<{
    field: string;
    ndvi: number;
    moisture: number;
    yieldPotential: number;
    riskScore: number;
  }>;
  diseaseRisks: Array<{ disease: string; fieldCount: number; prevalence: number }>;
  cropPerformance: Array<{
    crop: string;
    fields: number;
    avgHealth: number;
    avgRisk: number;
  }>;
  envAnalysis: Array<{ status: string; zones: number; pct: number }>;
  activeAlertCount: number;
  satelliteZoneCount: number;
}

function estimateYieldPotential(ndvi: number, moisturePct: number, crop: string): number {
  const profile = getCropProfile(crop as Field['crop']);
  const base = profile.cycleLength > 100 ? 3200 : 4800;
  return Math.round(ndvi * (moisturePct / 100) * base * 0.35 + base * 0.3);
}

function envStatus(
  ndvi: number,
  moisture: number,
  temp: number
): 'Optimal' | 'Suboptimal' | 'Stress' | 'Critical' {
  const moistureRatio = moisture / 70;
  const tempGood = temp > 15 && temp < 30;
  if (ndvi > 0.6 && moistureRatio > 0.8 && tempGood) return 'Optimal';
  if (ndvi > 0.5 && moistureRatio > 0.6) return 'Suboptimal';
  if (ndvi > 0.35 || moistureRatio < 0.5) return 'Stress';
  return 'Critical';
}

export async function buildInsightsContext(
  service: DbClient | null,
  fields: Field[]
): Promise<InsightsContextPayload> {
  const zoneIds = fields.flatMap((f) => f.zones.map((z) => z.id));
  const satMap = service
    ? await getLatestSatelliteForZones(service, zoneIds)
    : new Map();

  let satelliteZoneCount = 0;
  const zones: ZoneInsightRow[] = [];

  for (const field of fields) {
    const weather = service ? await getLatestWeatherForField(service, field.id) : null;

    for (const zone of field.zones) {
      const sat = satMap.get(zone.id);
      if (sat?.source === 'copernicus') satelliteZoneCount++;

      const s1 = sat?.s1MoistureIndex;
      const soilMoisture =
        weather?.soilMoisture ??
        (s1 != null ? Math.round(s1 * 100) : zone.soilMoistureAverage);
      const temperature = weather?.temp ?? sat?.s3Lst ?? zone.temperatureAverage;

      zones.push({
        zoneId: zone.id,
        zoneName: zone.name,
        fieldId: field.id,
        fieldName: field.name,
        crop: field.crop,
        ndvi: sat?.ndvi ?? zone.ndviAverage,
        ndmi: sat?.ndmi ?? zone.ndmiAverage,
        ndre: sat?.ndre ?? null,
        s1MoistureIndex: s1,
        s3Lst: sat?.s3Lst ?? null,
        soilMoisture,
        temperature,
        source: sat?.source ?? 'seed',
        sceneDate: sat?.sceneDate ?? null,
        diseaseRisks: zone.diseaseRisks,
      });
    }
  }

  const summary = await buildAnalyticsSummary(service, fields);

  const correlationData = summary.fields.map((f) => {
    const zoneRows = zones.filter((z) => z.fieldId === f.id);
    const avgMoisture =
      zoneRows.length > 0
        ? zoneRows.reduce((s, z) => s + (z.soilMoisture ?? 65), 0) / zoneRows.length
        : 65;
    return {
      field: f.name,
      ndvi: f.ndvi,
      moisture: Math.round(avgMoisture),
      yieldPotential: estimateYieldPotential(f.ndvi, avgMoisture, f.crop),
      riskScore: f.riskScore,
    };
  });

  const diseaseMap: Record<string, number> = {};
  for (const z of zones) {
    for (const d of z.diseaseRisks) {
      diseaseMap[d] = (diseaseMap[d] ?? 0) + 1;
    }
  }
  const diseaseRisks = Object.entries(diseaseMap)
    .map(([disease, fieldCount]) => ({
      disease,
      fieldCount,
      prevalence: fields.length ? (fieldCount / fields.length) * 100 : 0,
    }))
    .sort((a, b) => b.fieldCount - a.fieldCount);

  const cropPerf: Record<string, { fields: number; avgHealth: number; avgRisk: number }> =
    {};
  for (const f of summary.fields) {
    const label = getCropProfile(f.crop as Field['crop']).name;
    if (!cropPerf[label]) cropPerf[label] = { fields: 0, avgHealth: 0, avgRisk: 0 };
    const score = { excellent: 95, good: 80, warning: 60, critical: 35 }[f.health] ?? 50;
    cropPerf[label].fields += 1;
    cropPerf[label].avgHealth += score;
    cropPerf[label].avgRisk += f.riskScore;
  }
  const cropPerformance = Object.entries(cropPerf).map(([crop, data]) => ({
    crop,
    fields: data.fields,
    avgHealth: Math.round(data.avgHealth / data.fields),
    avgRisk: Math.round(data.avgRisk / data.fields),
  }));

  const envCounts = { Optimal: 0, Suboptimal: 0, Stress: 0, Critical: 0 };
  for (const z of zones) {
    const st = envStatus(z.ndvi, z.soilMoisture ?? 65, z.temperature ?? 25);
    envCounts[st] += 1;
  }
  const envTotal = zones.length || 1;
  const envAnalysis = (Object.entries(envCounts) as [keyof typeof envCounts, number][]).map(
    ([status, count]) => ({
      status,
      zones: count,
      pct: Math.round((count / envTotal) * 100),
    })
  );

  let activeAlertCount = 0;
  if (service) {
    const { data } = await service
      .from('alerts')
      .select('id')
      .eq('resolved', false);
    activeAlertCount = data?.length ?? 0;
  }

  const source: InsightsContextPayload['source'] =
    satelliteZoneCount > 0
      ? 'satellite_readings'
      : zones.length > 0
        ? 'zones_seed'
        : 'empty';

  return {
    source,
    zones,
    correlationData,
    diseaseRisks,
    cropPerformance,
    envAnalysis,
    activeAlertCount,
    satelliteZoneCount,
  };
}
