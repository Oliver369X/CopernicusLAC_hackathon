'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportStep } from '@/components/onboarding/import-step';
import { ImportMigrationGuide } from '@/components/onboarding/import-migration-guide';
import { ParcelSetupManager } from '@/components/parcels/parcel-setup-manager';
import { toast } from 'sonner';

interface ParcelStepProps {
  initialMode?: 'draw' | 'import';
  onComplete: () => void;
}

export function ParcelStep({ initialMode = 'draw', onComplete }: ParcelStepProps) {
  const [mode, setMode] = useState<'draw' | 'import'>(initialMode);
  const [fieldCount, setFieldCount] = useState(0);
  const [drawSessionDone, setDrawSessionDone] = useState(false);

  const refreshStatus = useCallback(async () => {
    const res = await fetch('/api/org/status');
    if (!res.ok) return;
    const data = (await res.json()) as { fieldCount: number };
    setFieldCount(data.fieldCount ?? 0);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  function handleDrawComplete() {
    setDrawSessionDone(true);
    void refreshStatus();
    toast.success('Parcela guardada. Podés agregar otra o continuar.');
  }

  const canContinue = fieldCount > 0 || drawSessionDone;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tus parcelas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Marcá en el mapa o importá un archivo con la geometría de tus lotes.
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'draw' | 'import')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="min-h-[44px]">
            Marcar en el mapa
          </TabsTrigger>
          <TabsTrigger value="import" className="min-h-[44px]">
            Importar archivo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-4">
          <ParcelSetupManager
            allowMultiple
            onComplete={() => {
              handleDrawComplete();
            }}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4 space-y-4">
          <ImportMigrationGuide compact />
          <Button variant="link" className="px-0 h-auto text-sm" asChild>
            <Link href="/setup/import?from=onboarding">Abrir migración en pantalla completa</Link>
          </Button>
          <ImportStep
            onComplete={() => {
              void refreshStatus();
              onComplete();
            }}
          />
        </TabsContent>
      </Tabs>

      {mode === 'draw' && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between border-t border-border pt-4">
          <Button variant="outline" asChild className="min-h-[44px]">
            <Link href="/setup/parcel?from=onboarding">Abrir en pantalla completa</Link>
          </Button>
          <Button
            className="min-h-[44px]"
            disabled={!canContinue}
            onClick={onComplete}
          >
            Continuar al sync satelital
          </Button>
        </div>
      )}
    </div>
  );
}
