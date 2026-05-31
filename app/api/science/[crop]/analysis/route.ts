import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFields, getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { analyzeCropMultisensor } from '@/lib/science/analyze';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ crop: string }> }
) {
  try {
    const { crop } = await params;
    if (!isScienceCrop(crop)) {
      return NextResponse.json({ error: 'Crop not supported for science module' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    const zoneIdParam = searchParams.get('zoneId');

    const fields = await getFields();
    const field = fieldId
      ? ((await getFieldByIdFromDb(fieldId)) ?? getFieldById(fieldId))
      : fields.find((f) => f.crop === crop);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    if (field.crop !== crop) {
      return NextResponse.json(
        { error: `Field crop is ${field.crop}, expected ${crop}` },
        { status: 400 }
      );
    }

    const zone =
      field.zones.find((z) => z.id === zoneIdParam) ?? field.zones[0];
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const service = await getDbService();

    const analysis = await analyzeCropMultisensor(
      crop as ScienceCropId,
      field,
      zone.id,
      service
    );

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('[science/analysis]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
