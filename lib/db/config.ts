export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && url.length > 12 && !url.includes('placeholder'));
}

export function getJwtSecret(): string {
  return process.env.AUTH_SECRET ?? 'dev-secret-change-in-production';
}
