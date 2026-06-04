import { NextResponse } from 'next/server';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DB no configurada' }, { status: 503 });
  }

  const { id } = await context.params;
  const row = await dbQueryOne<{
    zone_id: string;
    summary_es: string;
    actions: string[];
    phenology_hint: string | null;
    sources: string[];
    generated_at: string;
  }>(
    `SELECT zone_id, summary_es, actions, phenology_hint, sources, generated_at::text
     FROM zone_insights WHERE zone_id = $1`,
    [id]
  );

  if (!row) {
    return NextResponse.json({ error: 'Sin narrativa generada' }, { status: 404 });
  }

  return NextResponse.json({
    zoneId: row.zone_id,
    summaryEs: row.summary_es,
    actions: row.actions,
    phenologyHint: row.phenology_hint,
    sources: row.sources,
    generatedAt: row.generated_at,
  });
}
