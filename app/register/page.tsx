'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/layout/auth-layout';
import { toast } from 'sonner';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'true') {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, orgName }),
    });
    setLoading(false);

    if (!res.ok) {
      const { data, error } = await parseJsonResponse<{ error?: string }>(res);
      toast.error(data?.error ?? error ?? 'Error al registrarse');
      return;
    }

    toast.success('Cuenta creada correctamente.');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Comienza a monitorear tus cultivos hoy"
    >
      <form onSubmit={handleRegister} className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Al registrarte aceptás la{' '}
          <Link href="/privacidad" className="text-primary underline">
            política de privacidad
          </Link>
          .
        </p>
        <div className="space-y-2">
          <Label htmlFor="org">Organización / Finca</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="org"
              placeholder="Ej. Finca El Roble"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11"
              minLength={6}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
