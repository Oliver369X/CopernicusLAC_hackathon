'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/layout/auth-layout';
import { DEMO_PASSWORD, DEMO_USERS, SHOW_DEMO_CREDENTIALS } from '@/lib/constants/demo-credentials';
import { toast } from 'sonner';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process.env.NEXT_PUBLIC_AUTH_ENABLED) {
      router.push(redirect);
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const { data, error } = await parseJsonResponse<{ error?: string }>(res);
      toast.error(data?.error ?? error ?? 'Error al iniciar sesión');
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa a tu panel de monitoreo agrícola"
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
      </form>

      {SHOW_DEMO_CREDENTIALS && (
        <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground mb-2">Cuentas demo (contraseña: {DEMO_PASSWORD})</p>
          <ul className="space-y-1.5 text-muted-foreground">
            {DEMO_USERS.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  className="text-left hover:text-primary transition-colors"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  <span className="font-mono text-xs text-foreground">{u.email}</span>
                  <span className="ml-2 text-xs">({u.label})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-6 text-center">
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Crear cuenta gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
