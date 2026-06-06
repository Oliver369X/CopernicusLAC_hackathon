'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/layout/page-header';
import { ParcelStep } from '@/components/onboarding/parcel-step';
import { TeamInviteStep } from '@/components/onboarding/team-invite-step';
import { SatelliteSyncProgress } from '@/components/onboarding/satellite-sync-progress';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const modeParam = searchParams.get('mode');

  const [step, setStep] = useState(() => {
    if (stepParam === '2') return 2;
    if (stepParam === '3') return 3;
    return 1;
  });
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('BO');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [onboardingPhase, setOnboardingPhase] = useState<'team' | 'sync'>('team');

  useEffect(() => {
    if (stepParam === '2') setStep(2);
    if (stepParam === '3') setStep(3);
  }, [stepParam]);

  useEffect(() => {
    fetch('/api/org/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name?: string; country?: string } | null) => {
        if (data?.name) setOrgName(data.name);
        if (data?.country) setCountry(data.country);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

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

  function skipProfile() {
    if (orgName.trim()) {
      void saveProfile();
      return;
    }
    setStep(2);
  }

  const initialParcelMode = modeParam === 'import' ? 'import' : 'draw';

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
              placeholder="Finca María"
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => void saveProfile()}
              disabled={!orgName.trim()}
              className="min-h-[44px] flex-1"
            >
              Continuar
            </Button>
            {profileLoaded && orgName.trim() && (
              <Button variant="outline" className="min-h-[44px]" onClick={skipProfile}>
                Omitir
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <ParcelStep
          initialMode={initialParcelMode}
          onComplete={() => setStep(3)}
        />
      )}

      {step === 3 && onboardingPhase === 'team' && (
        <TeamInviteStep
          onContinue={() => setOnboardingPhase('sync')}
          onSkip={() => setOnboardingPhase('sync')}
        />
      )}

      {step === 3 && onboardingPhase === 'sync' && (
        <div className="space-y-6 text-center py-8">
          <h2 className="text-xl font-semibold">¡Listo!</h2>
          <SatelliteSyncProgress />
          <p className="text-muted-foreground text-sm">
            La sincronización satelital puede tardar hasta 48 h según cantidad de zonas. Podés
            monitorear el progreso en el panel.
          </p>
          <Button
            className="min-h-[44px]"
            onClick={() => router.push('/dashboard?onboarded=1')}
          >
            Ir al panel
          </Button>
          <Button variant="ghost" onClick={() => setStep(2)}>
            Agregar más parcelas
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
