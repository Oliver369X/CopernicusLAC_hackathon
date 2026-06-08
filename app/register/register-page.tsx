'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Building2, Loader2, Check, Sprout, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/layout/auth-layout';
import { toast } from 'sonner';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import type { BillingProfileChoice } from '@/lib/billing/types';
import { cn } from '@/lib/utils';

function planFromQuery(plan: string | null): BillingProfileChoice {
  if (plan === 'cooperative') return 'cooperative';
  return 'small_farmer';
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [billingProfile, setBillingProfile] = useState<BillingProfileChoice>(
    planFromQuery(searchParams.get('plan'))
  );
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
      body: JSON.stringify({ email, password, orgName, billingProfile }),
    });
    setLoading(false);

    if (!res.ok) {
      const { data, error } = await parseJsonResponse<{ error?: string }>(res);
      toast.error(data?.error ?? error ?? 'Error al registrarse');
      return;
    }

    toast.success('Cuenta creada correctamente.');
    router.push('/onboarding?done=/inicio');
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
          <Label>Tipo de finca</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              role="radio"
              aria-pressed={billingProfile === 'small_farmer'}
              onClick={() => setBillingProfile('small_farmer')}
              className={cn(
                'min-h-[44px] rounded-lg border-2 p-4 text-left transition-colors',
                billingProfile === 'small_farmer'
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Sprout className="h-5 w-5 text-primary shrink-0" />
                {billingProfile === 'small_farmer' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="font-medium mt-2">Pequeña agricultora</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hasta 50 ha · desde gratis · monitoreo por parcela
              </p>
            </button>
            <button
              type="button"
              role="radio"
              aria-pressed={billingProfile === 'cooperative'}
              onClick={() => setBillingProfile('cooperative')}
              className={cn(
                'min-h-[44px] rounded-lg border-2 p-4 text-left transition-colors',
                billingProfile === 'cooperative'
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Users className="h-5 w-5 text-primary shrink-0" />
                {billingProfile === 'cooperative' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="font-medium mt-2">Cooperativa / finca mediana</p>
              <p className="text-xs text-muted-foreground mt-1">
                51–500 ha · monitoreo por zonas · piloto BID
              </p>
            </button>
          </div>
        </div>

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
