import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { isDatabaseConfigured } from '@/lib/db/config';
import { parseGroundTruthCsv } from '@/lib/science/data/parse-csv';
import { parseAgroforestryGeoJson } from '@/lib/science/data/parse-geojson';
import { importGroundTruthRows } from '@/lib/science/data/import-ground-truth';
import { validateGroundTruthRows } from '@/lib/science/data/validate-rows';
import type { GroundTruthRow } from '@/lib/science/data/types';
import { csvTemplateForCrop } from '@/lib/science/data/types';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';

async function getService() {
  return getDbService();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get('crop') ?? 'soybean';
  if (!isScienceCrop(crop)) {
    return NextResponse.json({ error: 'Invalid crop' }, { status: 400 });
  }
  const csv = csvTemplateForCrop(crop as ScienceCropId);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ground-truth-${crop}.csv"`,
    },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let rows: GroundTruthRow[] = [];

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    if (file instanceof File) {
      const text = await file.text();
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        rows = parseAgroforestryGeoJson(text);
      } else {
        rows = parseGroundTruthCsv(text);
      }
    }
  } else {
    const body = (await request.json()) as { rows?: GroundTruthRow[]; csv?: string };
    if (body.csv) rows = parseGroundTruthCsv(body.csv);
    else if (body.rows) rows = body.rows;
  }

  if (!rows.length) {
    return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
  }

  const { valid, errors } = validateGroundTruthRows(rows);
  const service = await getService();

  if (!service) {
    return NextResponse.json({
      ok: true,
      imported: valid.length,
      skipped: rows.length - valid.length,
      errors,
      joinedTimeseries: 0,
      saved: false,
      preview: valid.slice(0, 5),
    });
  }

  const result = await importGroundTruthRows(service, valid, {
    autoValidate: true,
    minValidateCount: 5,
  });

  return NextResponse.json({ ...result, saved: true });
}
