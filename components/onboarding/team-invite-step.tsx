'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { INVITEABLE_ROLES, getRoleDescription } from '@/lib/team/roles';

export function TeamInviteStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('field_worker');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);

  async function sendInvite() {
    if (!email.trim()) {
      toast.error('Ingresá un email');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = (await res.json()) as { inviteUrl?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo invitar');
        return;
      }
      if (data.inviteUrl) {
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
          toast.success('Enlace copiado — compartilo por WhatsApp o email');
        } catch {
          toast.success('Invitación creada');
        }
      }
      setSent((n) => n + 1);
      setEmail('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Users className="h-6 w-6 text-primary shrink-0" />
        <div>
          <h2 className="text-xl font-semibold">Tu equipo de trabajo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Opcional: invitá a quien te ayuda en campo, un familiar o un agrónomo. Podés hacerlo
            después en Gestión → Equipo.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Input
            type="email"
            placeholder="tecnico@finca.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <select
            className="rounded-md border bg-background px-3 text-sm min-h-[40px]"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {INVITEABLE_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">{getRoleDescription(role)}</p>
        <Button variant="outline" disabled={busy} onClick={() => void sendInvite()}>
          {busy ? 'Enviando…' : sent > 0 ? 'Invitar a otro' : 'Generar enlace de invitación'}
        </Button>
        {sent > 0 && (
          <p className="text-xs text-[var(--aura-green)]">
            {sent} invitación{sent > 1 ? 'es' : ''} enviada{sent > 1 ? 's' : ''}.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="min-h-[44px] flex-1" onClick={onContinue}>
          Continuar al sync satelital
        </Button>
        <Button variant="ghost" className="min-h-[44px]" onClick={onSkip}>
          Omitir por ahora
        </Button>
      </div>
    </div>
  );
}
