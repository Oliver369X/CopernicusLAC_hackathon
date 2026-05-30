const DB_NAME = 'DoctorSoyaMaps';
const STORE = 'tiles';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface CachedTile {
  key: string;
  fieldId: string;
  layer: string;
  blob: Blob;
  cachedAt: string;
}

export async function cacheTile(
  fieldId: string,
  layer: string,
  url: string,
  blob: Blob
): Promise<void> {
  const db = await openDb();
  const key = `${fieldId}:${layer}:${url}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      key,
      fieldId,
      layer,
      blob,
      cachedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedTile(key: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result?.blob ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function prefetchFieldMapTiles(
  fieldId: string,
  bbox: string,
  layers: string[] = ['ndvi', 'ndre']
): Promise<number> {
  let count = 0;
  for (const layer of layers) {
    const url = `/api/satellite/tiles?layer=${layer}&bbox=${bbox}&width=512&height=512`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        await cacheTile(fieldId, layer, url, blob);
        count++;
      }
    } catch {
      // offline or API unavailable
    }
  }
  return count;
}
