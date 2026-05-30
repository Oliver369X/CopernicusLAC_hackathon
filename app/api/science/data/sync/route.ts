import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { syncFromSource, listDataSources } from '@/lib/science/data/sources/registry';
import '@/lib/science/data/sources/generic-rest';
import { importGroundTruthRows } from '@/lib/science/data/import-ground-truth';

async function getService() {
  return getDbService();
}

export async function GET() {
  return NextResponse.json({
    sources: listDataSources(),
    configured: Boolean(process.env.SCIENCE_DATA_API_URL),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { source?: string };
  const sourceId = body.source ?? 'generic';

  if (!process.env.SCIENCE_DATA_API_URL && sourceId === 'generic') {
    return NextResponse.json(
      { error: 'SCIENCE_DATA_API_URL not configured' },
      { status: 400 }
    );
  }

  try {
    const rows = await syncFromSource(sourceId);
    const service = await getService();

    if (!service) {
      return NextResponse.json({
        ok: true,
        fetched: rows.length,
        saved: false,
        preview: rows.slice(0, 5),
      });
    }

    const result = await importGroundTruthRows(service, rows, {
      autoValidate: true,
      minValidateCount: 5,
    });

    return NextResponse.json({ ...result, fetched: rows.length, saved: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
