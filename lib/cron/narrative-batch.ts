import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import { generateZoneNarrativeRuleBased } from '@/lib/agents/narrator/generate-zone-narrative';
import {
  getLatestSatelliteForZones,
  getLatestWeatherForField,
} from '@/lib/data/zone-satellite-metrics';
import { dbQuery } from '@/lib/db/pool';

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

      await dbQuery(
        `INSERT INTO zone_insights (zone_id, summary_es, actions, phenology_hint, sources, generated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, now())
         ON CONFLICT (zone_id) DO UPDATE SET
           summary_es = EXCLUDED.summary_es,
           actions = EXCLUDED.actions,
           phenology_hint = EXCLUDED.phenology_hint,
           sources = EXCLUDED.sources,
           generated_at = now()`,
        [
          zone.id,
          narrative.summary_es,
          JSON.stringify(narrative.actions),
          narrative.phenology_hint,
          JSON.stringify(narrative.sources),
        ]
      );
      written += 1;
    }
  }

  return written;
}
