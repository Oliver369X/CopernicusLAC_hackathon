import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createClient } from '@/lib/supabase/server';
import { generateAllAlerts } from '@/lib/alerts/generate-alerts';
import { getFieldNameMap } from '@/lib/mock-data/fields';

export async function GET() {
  if (isDatabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data?.length) {
      const fieldNames = getFieldNameMap();
      return NextResponse.json({
        alerts: data.map((a) => ({
          id: a.id,
          fieldId: a.field_id,
          fieldName: fieldNames[a.field_id as string] ?? a.field_id,
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

  const alerts = generateAllAlerts();
  return NextResponse.json({ alerts, source: 'engine' });
}

export async function PATCH(request: Request) {
  const { id, resolved } = (await request.json()) as { id: string; resolved: boolean };

  if (isDatabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from('alerts').update({ resolved }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
