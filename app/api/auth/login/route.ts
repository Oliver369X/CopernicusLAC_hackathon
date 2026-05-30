import { NextResponse } from 'next/server';
import { dbQueryOne } from '@/lib/db/pool';
import { verifyPassword } from '@/lib/auth/password';
import {
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/auth/session';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Auth disabled' }, { status: 503 });
  }

  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  const user = await dbQueryOne<{ id: string; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  );

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const token = await createSessionToken({ id: user.id, email: user.email });
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  const opts = sessionCookieOptions(token);
  response.cookies.set(opts.name, opts.value, opts);
  return response;
}
