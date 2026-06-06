'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Mail, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  INVITEABLE_ROLES,
  getRoleLabel,
  getRoleDescription,
} from '@/lib/team/roles';
import { TeamZoneAssignments } from '@/components/gestion/team-zone-assignments';

interface Member {
  user_id: string;
  email: string;
  role: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  inviteUrl?: string;
}

export function TeamPanel({ canInvite = true }: { canInvite?: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('field_worker');
  const [inviting, setInviting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/team/members'),
        canInvite ? fetch('/api/team/invites') : Promise.resolve(null),
      ]);
      if (membersRes.ok) {
        const data = (await membersRes.json()) as { members: Member[] };
        setMembers(data.members ?? []);
      }
      if (invitesRes?.ok) {
        const data = (await invitesRes.json()) as { invites: PendingInvite[] };
        setInvites(data.invites ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [canInvite]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function inviteMember() {
    if (!inviteEmail.trim()) {
      toast.error('Ingresá un email');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = (await res.json()) as { inviteUrl?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo invitar');
        return;
      }
      if (data.inviteUrl) {
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
          toast.success('Enlace de invitación copiado');
        } catch {
          toast.success(`Invitación: ${data.inviteUrl}`);
        }
      } else {
        toast.success('Invitación creada');
      }
      setInviteEmail('');
      await refresh();
    } finally {
      setInviting(false);
    }
  }

  async function copyInviteLink(inviteUrl: string | undefined) {
    if (!inviteUrl) {
      toast.error('Enlace no disponible');
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Enlace copiado');
    } catch {
      toast.success(inviteUrl);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Miembros del equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Solo vos por ahora.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{m.email}</span>
                  <span className="text-muted-foreground text-xs">
                    {getRoleLabel(m.role)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canInvite && invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Invitaciones pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p>{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleLabel(inv.role)} · vence{' '}
                      {new Date(inv.expires_at).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copyInviteLink(inv.inviteUrl)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Reenviar
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitar al equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Invitá familia, técnicos de campo o consultores. Cada persona recibe un enlace para
              registrarse o iniciar sesión.
            </p>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="email@finca.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="max-w-xs"
                type="email"
              />
              <select
                className="rounded-md border bg-background px-3 text-sm min-h-[40px]"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {INVITEABLE_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button disabled={inviting} onClick={() => void inviteMember()}>
                {inviting ? 'Enviando…' : 'Invitar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {getRoleDescription(inviteRole)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zonas por técnico</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamZoneAssignments />
        </CardContent>
      </Card>
    </div>
  );
}
