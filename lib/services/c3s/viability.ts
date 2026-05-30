import type { Field } from '@/lib/types/field';
import { getCropProfile } from '@/lib/mock-data/crops';

export interface ClimateViabilityResult {
  soilMoistureAnomaly: number;
  tempAnomaly: number;
  droughtIndex: number;
  viabilityScore: number;
  projectionYear: number;
  summary: string;
  recommendation: string;
}

/** Lightweight viability model; replace with CDS ERA5-Land batch when API key configured. */
export async function fetchClimateViabilityForField(
  field: Field
): Promise<ClimateViabilityResult | null> {
  const profile = getCropProfile(field.crop);
  const projectionYear = 2030;

  if (process.env.CDS_API_KEY) {
    try {
      const { fetchEra5LandAnomalies } = await import('./era5-land');
      const anomalies = await fetchEra5LandAnomalies(
        field.center.lat,
        field.center.lng
      );
      if (anomalies) {
        const droughtIndex = Math.max(0, -anomalies.soilMoistureAnomaly);
        const tempStress = Math.max(0, anomalies.tempAnomaly - 1.5);
        const viabilityScore = Math.max(
          0,
          Math.min(1, 1 - droughtIndex * 0.4 - tempStress * 0.15)
        );
        return {
          soilMoistureAnomaly: anomalies.soilMoistureAnomaly,
          tempAnomaly: anomalies.tempAnomaly,
          droughtIndex,
          viabilityScore,
          projectionYear,
          summary: `Proyección ${projectionYear}: anomalía humedad suelo ${anomalies.soilMoistureAnomaly.toFixed(2)}, temp ${anomalies.tempAnomaly.toFixed(1)}°C (ERA5-Land/CDS).`,
          recommendation:
            viabilityScore < 0.4
              ? `Considerar cultivo alternativo resistente a sequía (umbral ${profile.name}).`
              : `Cultivo ${profile.name} aún viable con manejo de riego adaptativo.`,
        };
      }
    } catch {
      // fallback below
    }
  }

  const avgNdvi =
    field.zones.reduce((s, z) => s + z.ndviAverage, 0) / field.zones.length;
  const avgMoisture =
    field.zones.reduce((s, z) => s + z.soilMoistureAverage, 0) / field.zones.length;

  const droughtIndex = avgMoisture < 50 ? (50 - avgMoisture) / 50 : 0;
  const tempAnomaly = field.center.lat < -30 ? 2.2 : 1.8;
  const viabilityScore = Math.max(
    0,
    Math.min(1, avgNdvi * 0.5 + (avgMoisture / 100) * 0.5 - droughtIndex * 0.3)
  );

  return {
    soilMoistureAnomaly: -droughtIndex,
    tempAnomaly,
    droughtIndex,
    viabilityScore,
    projectionYear,
    summary: `Modelo simplificado ${projectionYear}: estrés hídrico ${(droughtIndex * 100).toFixed(0)}%, calentamiento +${tempAnomaly}°C escenario SSP2-4.5 (estimado).`,
    recommendation:
      viabilityScore < 0.45
        ? `Evaluar sorgo o variedades ${profile.name} tolerantes a sequía para ${field.locationLabel}.`
        : `Mantener ${profile.name}; reforzar riego en ventanas críticas.`,
  };
}
