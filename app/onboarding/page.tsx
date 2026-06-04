'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/page-header';
import { ImportStep } from '@/components/onboarding/import-step';
import { SatelliteSyncProgress } from '@/components/onboarding/satellite-sync-progress';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('AR');

  async function saveProfile() {
    const res = await fetch('/api/org/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: orgName, country, areaUnit: 'ha' }),
    });
    if (!res.ok) {
      toast.error('No se pudo guardar el perfil');
      return;
    }
    setStep(2);
  }

  return (
    <PageContainer size="narrow">
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Tu finca</h1>
          <div className="space-y-2">
            <Label htmlFor="org-name">Nombre de la organización</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Estancia San José"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <Button onClick={() => void saveProfile()} disabled={!orgName.trim()}>
            Continuar
          </Button>
        </div>
      )}

      {step === 2 && (
        <ImportStep
          onComplete={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <div className="space-y-6 text-center py-8">
          <h2 className="text-xl font-semibold">¡Listo!</h2>
          <SatelliteSyncProgress />
          <p className="text-muted-foreground text-sm">
            La sincronización satelital puede tardar hasta 48 h según cantidad de zonas. Podés monitorear el progreso en el panel.
          </p>
          <Button onClick={() => router.push('/dashboard?onboarded=1')}>
            Ir al panel
          </Button>
          <Button variant="ghost" onClick={() => setStep(2)}>
            Importar más lotes
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
