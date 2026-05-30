import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/db/config';

export const SESSION_COOKIE = 'ds_session';

export interface SessionUser {
  id: string;
  email: string;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = payload.sub;
    const email = payload.email;
    if (typeof id !== 'string' || typeof email !== 'string') return null;
    return { id, email };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}
