import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFields, getFieldsForUser } from '@/lib/data/fields';
import { getSessionOrg } from '@/lib/auth/org';
import { buildHealthTrend } from '@/lib/analytics/health-trend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') ?? 'week') as 'week' | 'month' | 'season';
  if (!['week', 'month', 'season'].includes(range)) {
    return NextResponse.json({ error: 'range inválido' }, { status: 400 });
  }

  const org = await getSessionOrg();
  const fields = org
    ? await getFieldsForUser(org.user.id, org.orgId)
    : await getFields();
  const fieldIds = fields.map((f) => f.id);

  const service = await getDbService();
  const timeline = service
    ? await buildHealthTrend(service, fieldIds, range)
    : [];

  return NextResponse.json({ timeline, range });
}
