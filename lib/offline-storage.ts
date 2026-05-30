// Offline storage service using IndexedDB for PWA capabilities
export interface StoredObservation {
  id: string;
  fieldId: string;
  zoneId: string;
  timestamp: number;
  imageData?: string; // base64 encoded
  notes: string;
  location?: {
    lat: number;
    lng: number;
  };
  visionAnalysis?: Record<string, unknown>;
  synced: boolean;
  syncedAt?: number;
}

const DB_NAME = 'DoctorSoya';
const DB_VERSION = 1;
const STORE_NAME = 'observations';

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('fieldId', 'fieldId', { unique: false });
        store.createIndex('zoneId', 'zoneId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

export async function saveObservation(
  observation: StoredObservation
): Promise<string> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(observation);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

export async function getObservation(id: string): Promise<StoredObservation | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function getObservationsByField(
  fieldId: string
): Promise<StoredObservation[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('fieldId');
    const request = index.getAll(fieldId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getUnsyncedObservations(): Promise<StoredObservation[]> {
  const all = await getAllObservations();
  return all.filter((obs) => !obs.synced);
}

export async function markAsSynced(id: string): Promise<void> {
  const database = await initDB();
  const observation = await getObservation(id);

  if (!observation) return;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      ...observation,
      synced: true,
      syncedAt: Date.now(),
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteObservation(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllObservations(): Promise<StoredObservation[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function clearAllObservations(): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
