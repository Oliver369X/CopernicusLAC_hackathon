const MAX_WIDTH = 1280;
const MAX_BYTES = 2 * 1024 * 1024;
const JPEG_QUALITY = 0.82;

export async function compressImageDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  const blob = await fetch(dataUrl).then((r) => r.blob());
  if (blob.size <= MAX_BYTES && !dataUrl.includes('image/jpeg')) {
    return dataUrl;
  }

  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = JPEG_QUALITY;
  let result = canvas.toDataURL('image/jpeg', quality);

  while (result.length > MAX_BYTES * 1.37 && quality > 0.4) {
    quality -= 0.1;
    result = canvas.toDataURL('image/jpeg', quality);
  }

  return result;
}

export function validateImageDataUrl(dataUrl: string): { ok: boolean; error?: string } {
  if (!dataUrl.startsWith('data:image/')) {
    return { ok: false, error: 'Invalid image format' };
  }
  const base64Length = dataUrl.split(',')[1]?.length ?? 0;
  const approxBytes = (base64Length * 3) / 4;
  if (approxBytes > 5 * 1024 * 1024) {
    return { ok: false, error: 'Image exceeds 5MB limit' };
  }
  return { ok: true };
}
