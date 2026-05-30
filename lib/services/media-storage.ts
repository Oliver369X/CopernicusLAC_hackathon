import { v2 as cloudinary } from 'cloudinary';

export type StorageProvider = 'minio' | 'cloudinary' | 'both';

export function getStorageProvider(): StorageProvider {
  const p = process.env.STORAGE_PROVIDER ?? 'minio';
  if (p === 'cloudinary' || p === 'both') return p;
  return 'minio';
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  publicId: string
): Promise<string | null> {
  if (!isCloudinaryConfigured()) return null;

  configureCloudinary();
  const folder = process.env.CLOUDINARY_FOLDER ?? 'doctor-soya';

  try {
    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1200 }],
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res ?? {});
        }
      );
      stream.end(buffer);
    });

    return result.secure_url ?? null;
  } catch {
    return null;
  }
}
