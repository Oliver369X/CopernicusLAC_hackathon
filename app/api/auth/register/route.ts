import { NextResponse } from 'next/server';
import { dbQuery, dbQueryOne } from '@/lib/db/pool';
import { hashPassword } from '@/lib/auth/password';
import {
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/auth/session';
import { isDatabaseConfigured } from '@/lib/db/config';
import { seedFieldsForOrg } from '@/lib/data/fields';

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Auth disabled' }, { status: 503 });
  }

  const { email, password, orgName, inviteOnly, inviteToken } = (await request.json()) as {
    email?: string;
    password?: string;
    orgName?: string;
    inviteOnly?: boolean;
    inviteToken?: string;
  };

  if (!email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: 'Email y contraseña (mín. 6 caracteres) requeridos' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await dbQueryOne('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await dbQueryOne<{ id: string; email: string }>(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
    [normalizedEmail, passwordHash]
  );

  if (!user) {
    return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
  }

  if (inviteToken?.trim()) {
    const { acceptInviteForUser } = await import('@/lib/team/accept-invite');
    const accepted = await acceptInviteForUser(inviteToken.trim(), user.id, user.email);
    if ('error' in accepted) {
      return NextResponse.json({ error: accepted.error }, { status: accepted.status });
    }
  } else if (!inviteOnly) {
    const org = await dbQueryOne<{ id: string }>(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
      [orgName?.trim() || 'Mi Finca']
    );

    if (org) {
      await dbQuery(
        `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [org.id, user.id]
      );
      if (process.env.SEED_DEMO_ON_REGISTER === 'true') {
        await seedFieldsForOrg(org.id);
      }
    }
  } else {
    return NextResponse.json(
      { error: 'Registro solo vía invitación' },
      { status: 400 }
    );
  }

  const token = await createSessionToken({ id: user.id, email: user.email });
  const response = NextResponse.json({ ok: true, user });
  const opts = sessionCookieOptions(token);
  response.cookies.set(opts.name, opts.value, opts);
  return response;
}
