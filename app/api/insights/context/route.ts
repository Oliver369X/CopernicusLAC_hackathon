import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFields } from '@/lib/data/fields';
import { buildInsightsContext } from '@/lib/data/insights-context';

export async function GET() {
  const service = await getDbService();
  const fields = await getFields();
  const context = await buildInsightsContext(service, fields);
  return NextResponse.json(context);
}
