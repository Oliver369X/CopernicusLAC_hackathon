import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createClient } from '@/lib/supabase/server';
import { isScienceCrop } from '@/lib/science/crops/registry';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ labels: [] });
    }

    const supabase = await createClient();
    let query = supabase
      .from('science_validation_labels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (crop && isScienceCrop(crop)) query = query.eq('crop', crop);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ labels: [], warning: error.message });
    }

    return NextResponse.json({ labels: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation query failed';
    console.error('[science/validation GET]', message);
    return NextResponse.json({ labels: [], warning: message });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    observationId?: string;
    fieldId: string;
    zoneId?: string;
    crop: string;
    diseaseLabel?: string;
    severity?: string;
    healthLabel?: string;
    lat?: number;
    lng?: number;
    notes?: string;
  };

  if (!isScienceCrop(body.crop)) {
    return NextResponse.json({ error: 'Invalid crop' }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, saved: false });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('science_validation_labels')
    .insert({
      observation_id: body.observationId ?? null,
      field_id: body.fieldId,
      zone_id: body.zoneId ?? null,
      crop: body.crop,
      disease_label: body.diseaseLabel ?? null,
      severity: body.severity ?? 'none',
      health_label: body.healthLabel ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, label: data });
}
