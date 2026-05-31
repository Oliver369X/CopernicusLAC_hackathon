import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getDbService } from '@/lib/db/get-service';
import { createClient } from '@/lib/supabase/server';
import { analyzeCropMultisensor } from '@/lib/science/analyze';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId, ScienceExperimentRecord } from '@/lib/science/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');
    const fieldId = searchParams.get('fieldId');
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ experiments: [] });
    }

    const supabase = await createClient();
    let query = supabase
      .from('science_experiments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (crop && isScienceCrop(crop)) query = query.eq('crop', crop);
    if (fieldId) query = query.eq('field_id', fieldId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ experiments: [], warning: error.message });
    }

    return NextResponse.json({ experiments: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Experiments query failed';
    console.error('[science/experiments GET]', message);
    return NextResponse.json({ experiments: [], warning: message });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    crop: ScienceCropId;
    fieldId: string;
    zoneId?: string;
    hypothesis?: string;
    notes?: string;
  };

  if (!isScienceCrop(body.crop)) {
    return NextResponse.json({ error: 'Invalid crop' }, { status: 400 });
  }

  const field =
    (await getFieldByIdFromDb(body.fieldId)) ?? getFieldById(body.fieldId);
  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 });
  }

  const service = await getDbService();

  const result = await analyzeCropMultisensor(
    body.crop,
    field,
    body.zoneId ?? field.zones[0]?.id ?? '',
    service
  );

  const record: ScienceExperimentRecord = {
    crop: body.crop,
    fieldId: body.fieldId,
    zoneId: body.zoneId ?? field.zones[0]?.id ?? '',
    hypothesis: body.hypothesis ?? 'Fusión multisensor S1+S2 vs índice único',
    notes: body.notes ?? null,
    result,
  };

  if (service) {
    const { data, error } = await service
      .from('science_experiments')
      .insert({
        crop: record.crop,
        field_id: record.fieldId,
        zone_id: record.zoneId,
        hypothesis: record.hypothesis,
        notes: record.notes,
        result: record.result,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, result }, { status: 500 });
    }

    return NextResponse.json({ ok: true, experiment: data, result });
  }

  return NextResponse.json({ ok: true, result, saved: false });
}
