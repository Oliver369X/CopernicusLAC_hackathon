'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, MousePointerClick, Pen, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/page-header';
import { ParcelSetupManager } from '@/components/parcels/parcel-setup-manager';

export default function SetupParcelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? 'dashboard';

  const redirectAfter = useCallback(() => {
    if (from === 'gestion') return '/gestion?created=1';
    if (from === 'onboarding') return '/onboarding?step=3';
    return '/dashboard?created=1';
  }, [from]);

  const handleComplete = useCallback(
    (result: { fieldsCreated: number }) => {
      toast.success(
        result.fieldsCreated === 1
          ? '¡Parcela registrada!'
          : `¡${result.fieldsCreated} parcelas registradas!`
      );
      router.push(redirectAfter());
    },
    [router, redirectAfter]
  );

  const skipHref =
    from === 'gestion'
      ? '/gestion'
      : from === 'onboarding'
        ? '/onboarding?step=2'
        : '/dashboard';

  return (
    <PageContainer size="wide">
      <div className="mx-auto max-w-3xl py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Registrar parcela</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Marcá el contorno de tu lote en el mapa satelital
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-2 mb-2 font-medium">
            <Lightbulb className="h-4 w-4 text-primary" />
            Instrucciones rápidas
          </div>
          <ol className="space-y-2 text-muted-foreground">
            <li className="flex gap-2 items-start">
              <MousePointerClick className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              Clic en cada esquina del lote
            </li>
            <li className="flex gap-2 items-start">
              <Pen className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              Cerrá el polígono en el primer punto
            </li>
            <li className="flex gap-2 items-start">
              <Save className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              Completá nombre y cultivo, luego guardá
            </li>
          </ol>
        </div>

        <ParcelSetupManager initialScreen="draw" onComplete={handleComplete} />

        <p className="text-center text-sm">
          <Link href={skipHref} className="text-muted-foreground hover:text-primary underline">
            Omitir por ahora
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
