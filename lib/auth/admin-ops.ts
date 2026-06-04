import { getSessionUser } from '@/lib/auth/session';

/** Emails con acceso a /admin/ops (coma-separados en ADMIN_OPS_EMAILS). */
export async function canAccessAdminOps(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const list = (process.env.ADMIN_OPS_EMAILS ?? process.env.ADMIN_OPS_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length) return process.env.NODE_ENV === 'development';
  return list.includes(user.email.toLowerCase());
}
