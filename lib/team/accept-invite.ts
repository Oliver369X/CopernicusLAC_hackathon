import { dbQuery, dbQueryOne } from '@/lib/db/pool';

export interface InvitePreview {
  email: string;
  role: string;
  orgName: string;
  expired: boolean;
  accepted: boolean;
}

export async function getInviteByToken(token: string): Promise<InvitePreview | null> {
  const row = await dbQueryOne<{
    email: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
    org_name: string;
  }>(
    `SELECT i.email, i.role, i.expires_at::text, i.accepted_at::text,
            o.name AS org_name
     FROM invites i
     JOIN organizations o ON o.id = i.org_id
     WHERE i.token = $1`,
    [token]
  );
  if (!row) return null;
  return {
    email: row.email,
    role: row.role,
    orgName: row.org_name,
    expired: new Date(row.expires_at) < new Date(),
    accepted: Boolean(row.accepted_at),
  };
}

export async function acceptInviteForUser(
  token: string,
  userId: string,
  userEmail: string
): Promise<{ ok: true; orgId: string } | { error: string; status: number }> {
  const invite = await dbQueryOne<{
    id: string;
    org_id: string;
    email: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
  }>(
    `SELECT id, org_id, email, role, expires_at::text, accepted_at::text
     FROM invites WHERE token = $1`,
    [token]
  );

  if (!invite) return { error: 'Invitación no encontrada', status: 404 };
  if (invite.accepted_at) return { error: 'Invitación ya utilizada', status: 410 };
  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'Invitación expirada', status: 410 };
  }

  const normalized = userEmail.trim().toLowerCase();
  if (invite.email !== normalized) {
    return {
      error: 'Iniciá sesión con el email invitado',
      status: 403,
    };
  }

  const member = await dbQueryOne(
    `SELECT 1 FROM organization_members WHERE org_id = $1 AND user_id = $2`,
    [invite.org_id, userId]
  );
  if (!member) {
    await dbQuery(
      `INSERT INTO organization_members (org_id, user_id, role) VALUES ($1, $2, $3)`,
      [invite.org_id, userId, invite.role]
    );
  }

  await dbQuery(`UPDATE invites SET accepted_at = now() WHERE id = $1`, [invite.id]);
  return { ok: true, orgId: invite.org_id };
}
