import type { Field, FieldZone, GeoBounds, GeoPoint } from '@/lib/types/field';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createClient } from '@/lib/supabase/server';
import { normalizeGeoBounds } from '@/lib/services/copernicus/bounds';
import { deriveZoneBounds, isEmptyBounds } from '@/lib/geo/bounds-utils';

function rowToField(row: Record<string, unknown>, zones: FieldZone[]): Field {
  const center: GeoPoint = {
    lat: Number(row.center_lat),
    lng: Number(row.center_lng),
  };
  return {
    id: row.id as string,
    name: row.name as string,
    locationLabel: (row.location_label as string) ?? '',
    center,
    bounds: normalizeGeoBounds(row.bounds, center),
    area: Number(row.area_ha),
    crop: row.crop_type as Field['crop'],
    plantedDate: new Date(row.planting_date as string),
    daysFromPlanting: Number(row.days_from_planting ?? 0),
    zones,
    overallHealth: row.overall_health as Field['overallHealth'],
    lastUpdate: new Date(row.created_at as string),
    notifications: Number(row.notifications ?? 0),
    riskScore: Number(row.risk_score ?? 0),
  };
}

function rowToZone(
  row: Record<string, unknown>,
  crop: Field['crop'],
  fieldCenter: GeoPoint,
  fieldBoundsRaw: unknown,
  zoneIndex: number,
  totalZones: number
): FieldZone {
  let bounds: GeoBounds;
  if (isEmptyBounds(row.bounds)) {
    bounds = deriveZoneBounds(fieldBoundsRaw, fieldCenter, zoneIndex, totalZones);
  } else {
    bounds = normalizeGeoBounds(row.bounds, fieldCenter);
  }
  return {
    id: row.id as string,
    name: row.name as string,
    fieldId: row.field_id as string,
    area: Number(row.area_ha),
    bounds,
    crop,
    health: row.health as FieldZone['health'],
    ndviAverage: Number(row.ndvi_average),
    ndmiAverage: Number(row.ndmi_average),
    temperatureAverage: Number(row.temperature_average),
    soilMoistureAverage: Number(row.soil_moisture_average),
    observationCount: Number(row.observation_count ?? 0),
    diseaseRisks: (row.disease_risks as string[]) ?? [],
    lastObservation: new Date(),
    lastUpdate: new Date(),
  };
}

export async function getFields(orgId?: string): Promise<Field[]> {
  if (!isDatabaseConfigured()) {
    return MOCK_FIELDS;
  }

  try {
    const db = await createClient();
    let query = db.from('fields').select('*');

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data: fields, error } = await query;
    if (error || !fields?.length) return [];

    const fieldIds = (fields as Record<string, unknown>[]).map((f) => f.id);
    const { data: zones } = await db
      .from('zones')
      .select('*')
      .in('field_id', fieldIds);

    return (fields as Record<string, unknown>[]).map((field) => {
      const crop = field.crop_type as Field['crop'];
      const center: GeoPoint = {
        lat: Number(field.center_lat),
        lng: Number(field.center_lng),
      };
      const zoneRows = ((zones as Record<string, unknown>[]) ?? []).filter(
        (z) => z.field_id === field.id
      );
      const fieldZones = zoneRows.map((z, index) =>
        rowToZone(z, crop, center, field.bounds, index, zoneRows.length)
      );
      return rowToField(field, fieldZones);
    });
  } catch {
    return [];
  }
}

export async function getFieldsForUser(
  userId: string,
  orgId?: string
): Promise<Field[]> {
  const all = await getFields(orgId);
  if (!isDatabaseConfigured() || !orgId) return all;

  try {
    const db = await createClient();
    const { data: member } = await db
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!member || member.role !== 'field_worker') return all;

    const { data: assignments } = await db
      .from('member_zone_assignments')
      .select('zone_id')
      .eq('org_id', orgId)
      .eq('user_id', userId);

    const zoneIds = new Set(
      (assignments ?? []).map((a) => String((a as { zone_id: string }).zone_id))
    );
    if (zoneIds.size === 0) return all;

    return all
      .map((field) => ({
        ...field,
        zones: field.zones.filter((z) => zoneIds.has(z.id)),
      }))
      .filter((f) => f.zones.length > 0);
  } catch {
    return all;
  }
}

export async function countFieldsForOrg(orgId: string): Promise<number> {
  if (!isDatabaseConfigured()) return MOCK_FIELDS.length;
  try {
    const { dbQueryOne } = await import('@/lib/db/pool');
    const row = await dbQueryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fields WHERE org_id = $1`,
      [orgId]
    );
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function getFieldByIdFromDb(fieldId: string): Promise<Field | undefined> {
  const fields = await getFields();
  return fields.find((f) => f.id === fieldId);
}

export async function seedFieldsForOrg(orgId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const { createServiceClient } = await import('@/lib/supabase/server');
  const db = await createServiceClient();

  for (const field of MOCK_FIELDS) {
    await db.from('fields').upsert(
      {
        id: field.id,
        org_id: orgId,
        name: field.name,
        crop_type: field.crop,
        area_ha: field.area,
        center_lat: field.center.lat,
        center_lng: field.center.lng,
        bounds: field.bounds,
        location_label: field.locationLabel,
        planting_date: field.plantedDate.toISOString().split('T')[0],
        days_from_planting: field.daysFromPlanting,
        overall_health: field.overallHealth,
        risk_score: field.riskScore,
        notifications: field.notifications,
      },
      { onConflict: 'id' }
    );

    for (const zone of field.zones) {
      await db.from('zones').upsert(
        {
          id: zone.id,
          field_id: field.id,
          name: zone.name,
          area_ha: zone.area,
          bounds: zone.bounds,
          health: zone.health,
          ndvi_average: zone.ndviAverage,
          ndmi_average: zone.ndmiAverage,
          temperature_average: zone.temperatureAverage,
          soil_moisture_average: zone.soilMoistureAverage,
          observation_count: zone.observationCount,
          disease_risks: zone.diseaseRisks,
        },
        { onConflict: 'id' }
      );
    }
  }
}
