import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFields, getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { analyzeCropMultisensor, resolveScienceCrop } from '@/lib/science/analyze';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ crop: string }> }
) {
  const { crop } = await params;
  if (!isScienceCrop(crop)) {
    return NextResponse.json({ error: 'Crop not supported for science module' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const fieldId = searchParams.get('fieldId');
  const zoneId = searchParams.get('zoneId');

  let fields = await getFields();
  let field = fieldId
    ? (await getFieldByIdFromDb(fieldId)) ?? getFieldById(fieldId)
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

  const service = await getDbService();

  const analysis = await analyzeCropMultisensor(
    crop as ScienceCropId,
    field,
    zoneId ?? field.zones[0]?.id ?? '',
    service
  );

  return NextResponse.json(analysis);
}
