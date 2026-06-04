import { NextResponse } from 'next/server';
import { getSessionOrg } from '@/lib/auth/org';
import { getFieldsForUser } from '@/lib/data/fields';
import { dbQuery } from '@/lib/db/pool';

export async function GET(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const fields = await getFieldsForUser(org.user.id, org.orgId);
  const zoneIds = fields.flatMap((f) => f.zones.map((z) => z.id));

  const readings =
    zoneIds.length > 0
      ? await dbQuery<{
          zone_id: string;
          ndvi: number;
          ndmi: number;
          source: string;
          captured_at: string;
        }>(
          `SELECT DISTINCT ON (zone_id) zone_id, ndvi, ndmi, source, captured_at::text
           FROM satellite_readings WHERE zone_id = ANY($1::text[])
           ORDER BY zone_id, captured_at DESC`,
          [zoneIds]
        )
      : [];

  const readMap = new Map(readings.map((r) => [r.zone_id, r]));

  const header =
    'campo,zona,cultivo,area_ha,ndvi,ndmi,fuente,captura,salud,riesgo\n';
  const rows: string[] = [];

  for (const field of fields) {
    for (const zone of field.zones) {
      const sat = readMap.get(zone.id);
      rows.push(
        [
          field.name,
          zone.name,
          field.crop,
          field.area,
          sat?.ndvi ?? zone.ndviAverage,
          sat?.ndmi ?? zone.ndmiAverage,
          sat?.source ?? 'seed',
          sat?.captured_at ?? '',
          zone.health,
          field.riskScore,
        ].join(',')
      );
    }
  }

  const csv = header + rows.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="doctor-soya-reporte.csv"',
    },
  });
}
