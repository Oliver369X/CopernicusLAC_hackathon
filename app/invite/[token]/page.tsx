'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface InviteInfo {
  email: string;
  role: string;
  orgName: string;
  expired: boolean;
  accepted: boolean;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const token = String(params.token ?? '');
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/team/accept?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d: { invite?: InviteInfo; error?: string }) => {
        if (d.invite) {
          setInvite(d.invite);
          setEmail(d.invite.email);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function acceptAfterAuth() {
    const res = await fetch('/api/team/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? 'No se pudo aceptar');
      return;
    }
    toast.success('¡Te uniste al equipo!');
    router.push('/dashboard');
  }

  async function submitAuth() {
    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { email, password, orgName: invite?.orgName, inviteToken: token };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Error de autenticación');
        return;
      }
      await acceptAfterAuth();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Cargando invitación…</p>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-sm">
            Invitación no válida.{' '}
            <Link href="/login" className="text-primary underline">
              Ir al login
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (invite.expired || invite.accepted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-sm">
            {invite.accepted ? 'Esta invitación ya fue usada.' : 'La invitación expiró.'}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Unirse a {invite.orgName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Rol: <strong>{invite.role}</strong> · Email: <strong>{invite.email}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              variant={mode === 'login' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('login')}
            >
              Ya tengo cuenta
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('register')}
            >
              Crear cuenta
            </Button>
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            readOnly={mode === 'register'}
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />
          <Button className="w-full" disabled={busy} onClick={() => void submitAuth()}>
            {busy ? 'Procesando…' : 'Aceptar invitación'}
          </Button>
          <p className="text-xs text-muted-foreground">
            ¿Ya iniciaste sesión?{' '}
            <button
              type="button"
              className="text-primary underline"
              onClick={() => void acceptAfterAuth()}
            >
              Confirmar unión
            </button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
