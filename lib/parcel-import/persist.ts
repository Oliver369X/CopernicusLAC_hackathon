import { getPool } from '@/lib/db/pool';
import type { ImportParcel } from './types';
import { buildFieldAndZones } from './split-zones';

export async function persistImportParcels(
  orgId: string,
  parcels: ImportParcel[],
  zoneSplitCount: number
): Promise<{ fieldIds: string[]; zoneIds: string[] }> {
  const pool = getPool();
  const client = await pool.connect();
  const fieldIds: string[] = [];
  const zoneIds: string[] = [];

  try {
    await client.query('BEGIN');

    for (const parcel of parcels) {
      const { field, zones } = buildFieldAndZones(parcel, orgId, zoneSplitCount);
      fieldIds.push(field.id);

      await client.query(
        `INSERT INTO fields (id, org_id, name, crop_type, area_ha, center_lat, center_lng, bounds,
          location_label, planting_date, days_from_planting, overall_health, risk_score, notifications)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          field.id,
          field.org_id,
          field.name,
          field.crop_type,
          field.area_ha,
          field.center_lat,
          field.center_lng,
          JSON.stringify(field.bounds),
          field.location_label,
          field.planting_date,
          field.days_from_planting,
          field.overall_health,
          field.risk_score,
          field.notifications,
        ]
      );

      for (const zone of zones) {
        zoneIds.push(zone.id);
        await client.query(
          `INSERT INTO zones (id, field_id, name, area_ha, bounds, health, ndvi_average, ndmi_average,
            temperature_average, soil_moisture_average, observation_count, disease_risks)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            zone.id,
            zone.field_id,
            zone.name,
            zone.area_ha,
            JSON.stringify(zone.bounds),
            zone.health,
            zone.ndvi_average,
            zone.ndmi_average,
            zone.temperature_average,
            zone.soil_moisture_average,
            zone.observation_count,
            JSON.stringify(zone.disease_risks),
          ]
        );
      }
    }

    await client.query(
      `UPDATE organizations SET onboarding_completed_at = now() WHERE id = $1`,
      [orgId]
    );

    await client.query('COMMIT');
    return { fieldIds, zoneIds };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
