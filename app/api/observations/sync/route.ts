import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import {
  getStorageProvider,
  uploadToCloudinary,
} from '@/lib/services/media-storage';

interface SyncItem {
  id: string;
  fieldId: string;
  zoneId: string;
  notes?: string;
  location?: { lat: number; lng: number };
  imageData?: string;
  timestamp?: number;
}

export async function POST(request: Request) {
  const { observations } = (await request.json()) as { observations: SyncItem[] };

  if (!observations?.length) {
    return NextResponse.json({ synced: [] });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      synced: observations.map((o) => o.id),
      offline: true,
    });
  }

  const service = await createServiceClient();
  const synced: string[] = [];

  for (const obs of observations) {
    let imagePath: string | null = null;
    let imageUrl: string | null = null;
    const storageProvider = getStorageProvider();

    if (obs.imageData?.startsWith('data:')) {
      const base64 = obs.imageData.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const path = `${obs.fieldId}/${obs.id}.jpg`;

      if (storageProvider === 'cloudinary' || storageProvider === 'both') {
        imageUrl = await uploadToCloudinary(buffer, `${obs.fieldId}_${obs.id}`);
      }

      if (storageProvider === 'minio' || storageProvider === 'both') {
        const { error } = await service.storage
          .from('observations')
          .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
        if (!error) imagePath = path;
      } else if (imageUrl) {
        imagePath = imageUrl;
      }
    }

    const { error } = await service.from('observations').upsert({
      id: obs.id,
      field_id: obs.fieldId,
      zone_id: obs.zoneId,
      notes: obs.notes ?? '',
      lat: obs.location?.lat,
      lng: obs.location?.lng,
      image_path: imagePath,
      image_url: imageUrl,
      synced_at: new Date().toISOString(),
    });

    if (!error) synced.push(obs.id);
  }

  return NextResponse.json({ synced });
}
