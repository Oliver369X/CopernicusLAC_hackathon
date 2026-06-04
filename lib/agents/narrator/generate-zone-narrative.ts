import type { HealthStatus } from '@/lib/types/field';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import type { CropType } from '@/lib/mock-data/crops';

export interface ZoneNarrativeInput {
  zoneName: string;
  crop: CropType;
  ndvi: number;
  ndmi: number;
  soilMoisture: number;
  daysFromPlanting: number;
  health: HealthStatus;
  alertTitles: string[];
}

export interface ZoneNarrativeOutput {
  summary_es: string;
  actions: string[];
  phenology_hint: string;
  sources: string[];
}

export function generateZoneNarrativeRuleBased(
  input: ZoneNarrativeInput
): ZoneNarrativeOutput {
  const profile = CROP_PROFILES[input.crop];
  const stage =
    profile.growthStages.find(
      (s) =>
        input.daysFromPlanting >= s.daysFromPlanting[0] &&
        input.daysFromPlanting <= s.daysFromPlanting[1]
    )?.stage ?? 'desarrollo';

  let summary = `En ${input.zoneName} (${profile.name}), NDVI ${input.ndvi.toFixed(2)} y humedad de suelo ${input.soilMoisture}%.`;
  if (input.ndvi < 0.45) {
    summary += ' Se observa estrés vegetativo significativo.';
  } else if (input.ndvi >= 0.65) {
    summary += ' El vigor del cultivo es favorable.';
  }

  const actions: string[] = [];
  if (input.soilMoisture < 50) actions.push('Evaluar riego localizado en las próximas 48 h.');
  if (input.ndvi < 0.5) actions.push('Scouting de campo para confirmar causa del bajo NDVI.');
  if (input.alertTitles.length) {
    actions.push(`Revisar alerta: ${input.alertTitles[0]}`);
  }
  if (!actions.length) actions.push('Mantener monitoreo satelital semanal.');

  return {
    summary_es: summary,
    actions,
    phenology_hint: `${stage} — día ${input.daysFromPlanting} del ciclo`,
    sources: ['Copernicus CDSE', 'Open-Meteo', 'Motor de alertas'],
  };
}
