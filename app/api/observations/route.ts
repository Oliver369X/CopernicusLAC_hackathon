import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import {
  getStorageProvider,
  uploadToCloudinary,
} from '@/lib/services/media-storage';

interface ObservationPayload {
  id: string;
  fieldId: string;
  zoneId: string;
  notes?: string;
  location?: { lat: number; lng: number };
  imageData?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ObservationPayload;
  const { id, fieldId, zoneId, notes, location, imageData } = body;

  if (!id || !fieldId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (imageData && !imageData.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
  }

  if (imageData) {
    const base64Length = imageData.split(',')[1]?.length ?? 0;
    if ((base64Length * 3) / 4 > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image exceeds 5MB' }, { status: 400 });
    }
  }

  let imagePath: string | null = null;
  let imageUrl: string | null = null;
  let userId: string | null = null;

  const storageProvider = getStorageProvider();

  if (isDatabaseConfigured()) {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;

    const service = await createServiceClient();

    if (imageData?.startsWith('data:')) {
      const base64 = imageData.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const path = `${fieldId}/${id}.jpg`;

      if (storageProvider === 'cloudinary' || storageProvider === 'both') {
        imageUrl = await uploadToCloudinary(buffer, `${fieldId}_${id}`);
      }

      if (storageProvider === 'minio' || storageProvider === 'both') {
        const { error: uploadError } = await service.storage
          .from('observations')
          .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) imagePath = path;
      } else if (imageUrl) {
        imagePath = imageUrl;
      }
    }

    const { error } = await service.from('observations').upsert({
      id,
      field_id: fieldId,
      zone_id: zoneId,
      user_id: userId,
      notes: notes ?? '',
      lat: location?.lat,
      lng: location?.lng,
      image_path: imagePath,
      image_url: imageUrl,
      synced_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id, imagePath, imageUrl, synced: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fieldId = searchParams.get('fieldId');

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ observations: [] });
  }

  const db = await createClient();
  let query = db.from('observations').select('*').order('created_at', { ascending: false });

  if (fieldId) query = query.eq('field_id', fieldId);

  const { data, error } = await query.limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ observations: data ?? [] });
}
