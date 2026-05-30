import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { downloadObject } from '@/lib/storage/minio';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 404 });
  }

  const service = await createServiceClient();
  const { data } = await service
    .from('observations')
    .select('image_path')
    .eq('id', id)
    .maybeSingle();

  if (!data?.image_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const imagePath = data.image_path as string;

  if (imagePath.startsWith('http')) {
    const imgRes = await fetch(imagePath);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  const buffer = await downloadObject(imagePath);
  if (!buffer) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
