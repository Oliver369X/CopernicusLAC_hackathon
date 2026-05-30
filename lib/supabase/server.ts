import { isDatabaseConfigured } from '@/lib/db/config';
import { createDbClient, type DbClient } from '@/lib/db/adapter';

export async function createClient(): Promise<DbClient> {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }
  return createDbClient(false);
}

export async function createServiceClient(): Promise<DbClient> {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }
  return createDbClient(true);
}

export { isDatabaseConfigured };
