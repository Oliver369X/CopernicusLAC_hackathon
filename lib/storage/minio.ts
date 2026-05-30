import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { isDatabaseConfigured } from '@/lib/db/config';

const BUCKET = process.env.MINIO_BUCKET ?? 'observations';

function s3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.MINIO_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    },
    forcePathStyle: true,
  });
}

export function isMinioConfigured(): boolean {
  return isDatabaseConfigured();
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await s3Client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function downloadObject(key: string): Promise<Buffer | null> {
  try {
    const res = await s3Client().send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

export function createStorageApi() {
  return {
    from(_bucket: string) {
      return {
        async upload(
          path: string,
          body: Buffer,
          opts?: { contentType?: string; upsert?: boolean }
        ) {
          if (!isMinioConfigured()) {
            return { error: { message: 'Storage not configured' } };
          }
          try {
            await uploadObject(path, body, opts?.contentType ?? 'application/octet-stream');
            return { error: null };
          } catch (e) {
            return {
              error: { message: e instanceof Error ? e.message : 'Upload failed' },
            };
          }
        },
        async download(path: string) {
          if (!isMinioConfigured()) {
            return { data: null, error: { message: 'Storage not configured' } };
          }
          const buf = await downloadObject(path);
          if (!buf) return { data: null, error: { message: 'Not found' } };
          return {
            data: new Blob([buf], { type: 'image/jpeg' }),
            error: null,
          };
        },
      };
    },
  };
}
