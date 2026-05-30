import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFields } from '@/lib/data/fields';
import { buildAnalyticsSummary } from '@/lib/data/analytics-from-db';

export async function GET() {
  const fields = await getFields();
  const service = await getDbService();
  const summary = await buildAnalyticsSummary(service, fields);
  return NextResponse.json(summary);
}
