import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import { generateZoneNarrativeRuleBased } from '@/lib/agents/narrator/generate-zone-narrative';
import {
  getLatestSatelliteForZones,
  getLatestWeatherForField,
} from '@/lib/data/zone-satellite-metrics';

export async function runNarrativeBatch(
  service: DbClient,
  fields: Field[]
): Promise<number> {
  let written = 0;

  for (const field of fields) {
    const zoneIds = field.zones.map((z) => z.id);
    const satMap = await getLatestSatelliteForZones(service, zoneIds);
    const weather = await getLatestWeatherForField(service, field.id);

    const { data: alerts } = await service
      .from('alerts')
      .select('title, zone_id')
      .eq('field_id', field.id)
      .eq('resolved', false);

    for (const zone of field.zones) {
      const sat = satMap.get(zone.id);
      const ndvi = sat?.ndvi ?? zone.ndviAverage;
      const ndmi = sat?.ndmi ?? zone.ndmiAverage;
      const soil = weather?.soilMoisture ?? zone.soilMoistureAverage;
      const zoneAlerts = (alerts ?? [])
        .filter((a) => (a as { zone_id: string | null }).zone_id === zone.id)
        .map((a) => String((a as { title: string }).title));

      const narrative = generateZoneNarrativeRuleBased({
        zoneName: zone.name,
        crop: field.crop,
        ndvi,
        ndmi,
        soilMoisture: soil,
        daysFromPlanting: field.daysFromPlanting,
        health: zone.health,
        alertTitles: zoneAlerts,
      });

      await service.from('zone_insights').upsert(
        {
          zone_id: zone.id,
          summary_es: narrative.summary_es,
          actions: narrative.actions,
          phenology_hint: narrative.phenology_hint,
          sources: narrative.sources,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'zone_id' }
      );
      written += 1;
    }
  }

  return written;
}
