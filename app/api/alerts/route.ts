import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createClient } from '@/lib/supabase/server';
import { generateAllAlerts } from '@/lib/alerts/generate-alerts';
import { getSessionOrg } from '@/lib/auth/org';
import { dbQuery } from '@/lib/db/pool';

export async function GET() {
  const org = await getSessionOrg();

  if (isDatabaseConfigured() && org) {
    const rows = await dbQuery<{
      id: string;
      field_id: string;
      field_name: string;
      zone_id: string | null;
      type: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string | null;
      metrics: unknown;
      resolved: boolean;
      created_at: string;
    }>(
      `SELECT a.id, a.field_id, f.name AS field_name, a.zone_id, a.type, a.severity,
              a.title, a.description, a.recommendation, a.metrics, a.resolved, a.created_at::text
       FROM alerts a
       JOIN fields f ON f.id = a.field_id
       WHERE f.org_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [org.orgId]
    );

    if (rows.length) {
      return NextResponse.json({
        alerts: rows.map((a) => ({
          id: a.id,
          fieldId: a.field_id,
          fieldName: a.field_name,
          zoneId: a.zone_id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          recommendation: a.recommendation,
          metrics: a.metrics,
          resolved: a.resolved,
          timestamp: a.created_at,
        })),
        source: 'database',
      });
    }
  }

  if (isDatabaseConfigured()) {
    const supabase = await createClient();
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50);
    if (org) {
      const { data: fieldRows } = await supabase
        .from('fields')
        .select('id, name')
        .eq('org_id', org.orgId);
      const fieldIds = (fieldRows ?? []).map((f) => f.id as string);
      if (!fieldIds.length) {
        return NextResponse.json({ alerts: [], source: 'database' });
      }
      query = query.in('field_id', fieldIds);
      const { data, error } = await query;
      if (!error && data?.length) {
        const names = Object.fromEntries(
          (fieldRows ?? []).map((f) => [f.id as string, f.name as string])
        );
        return NextResponse.json({
          alerts: data.map((a) => ({
            id: a.id,
            fieldId: a.field_id,
            fieldName: names[a.field_id as string] ?? a.field_id,
            zoneId: a.zone_id,
            type: a.type,
            severity: a.severity,
            title: a.title,
            description: a.description,
            recommendation: a.recommendation,
            metrics: a.metrics,
            resolved: a.resolved,
            timestamp: a.created_at,
          })),
          source: 'database',
        });
      }
    }
  }

  const alerts = generateAllAlerts();
  return NextResponse.json({ alerts, source: 'engine' });
}

export async function PATCH(request: Request) {
  const { id, resolved } = (await request.json()) as { id: string; resolved: boolean };
  const org = await getSessionOrg();

  if (isDatabaseConfigured() && org) {
    const rows = await dbQuery(
      `UPDATE alerts a SET resolved = $1
       FROM fields f
       WHERE a.id = $2 AND a.field_id = f.id AND f.org_id = $3
       RETURNING a.id`,
      [resolved, id, org.orgId]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (isDatabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from('alerts').update({ resolved }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
