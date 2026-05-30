import { isDatabaseConfigured } from './config';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { DbClient } from './adapter';

export async function getDbService(): Promise<DbClient | null> {
  if (!isDatabaseConfigured()) return null;
  return createServiceClient();
}

export async function getDbClient(): Promise<DbClient | null> {
  if (!isDatabaseConfigured()) return null;
  return createClient();
}

export { isDatabaseConfigured };
