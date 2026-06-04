import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isDatabaseConfigured } from '@/lib/db/config';
import {
  acceptInviteForUser,
  getInviteByToken,
} from '@/lib/team/accept-invite';

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 503 });
  }
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

  const preview = await getInviteByToken(token);
  if (!preview) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });

  return NextResponse.json({ invite: preview });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = (await request.json()) as { token?: string };
  const token =
    body.token?.trim() ?? new URL(request.url).searchParams.get('token') ?? '';
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

  const result = await acceptInviteForUser(token, user.id, user.email);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, orgId: result.orgId });
}
