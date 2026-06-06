'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-header';
import { ImportStep } from '@/components/onboarding/import-step';
import { ImportMigrationGuide } from '@/components/onboarding/import-migration-guide';
import { Button } from '@/components/ui/button';

export default function SetupImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? 'dashboard';

  const doneHref =
    from === 'gestion'
      ? '/gestion?imported=1'
      : from === 'onboarding'
        ? '/onboarding?step=3'
        : '/dashboard?imported=1';

  return (
    <PageContainer size="narrow">
      <div className="py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Migrar parcelas desde archivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            QGIS, ArcGIS, Google Earth o planilla CSV — sin marcar de nuevo en el mapa.
          </p>
        </div>

        <ImportMigrationGuide />

        <ImportStep
          showGuide={false}
          onComplete={() => {
            router.push(doneHref);
          }}
        />

        <div className="flex flex-wrap gap-3 justify-between pt-2">
          <Button variant="outline" asChild className="min-h-[44px]">
            <Link href={`/setup/parcel?from=${from}`}>Marcar en el mapa</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={doneHref.replace('?imported=1', '').replace('?step=3', '') || '/dashboard'}>
              Omitir
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
