'use client';

import { useState, useCallback } from 'react';
import type { Polygon } from 'geojson';
import { Button } from '@/components/ui/button';
import { ParcelDrawingMode } from './parcel-drawing-mode';
import { ParcelSetupWizard } from './parcel-setup-wizard';
import type { DrawingMetrics } from './drawing/drawing-types';

type Screen = 'draw' | 'wizard' | 'success';

interface ParcelSetupManagerProps {
  initialScreen?: 'draw' | 'wizard';
  allowMultiple?: boolean;
  onComplete: (result: { fieldsCreated: number }) => void;
}

export function ParcelSetupManager({
  initialScreen = 'draw',
  allowMultiple = true,
  onComplete,
}: ParcelSetupManagerProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [metrics, setMetrics] = useState<DrawingMetrics | null>(null);
  const [fieldsCreated, setFieldsCreated] = useState(0);

  const handleDrawNext = useCallback((poly: Polygon, m: DrawingMetrics) => {
    setPolygon(poly);
    setMetrics(m);
    setScreen('wizard');
  }, []);

  const handleCreated = useCallback(
    (_result: { fieldId: string; zoneIds: string[] }) => {
      setFieldsCreated((n) => n + 1);
      setScreen('success');
    },
    []
  );

  const handleAddAnother = useCallback(() => {
    setPolygon(null);
    setMetrics(null);
    setScreen('draw');
  }, []);

  const handleFinish = useCallback(() => {
    onComplete({ fieldsCreated: Math.max(1, fieldsCreated) });
  }, [fieldsCreated, onComplete]);

  if (screen === 'draw') {
    return <ParcelDrawingMode onNext={handleDrawNext} />;
  }

  if (screen === 'wizard' && polygon && metrics) {
    return (
      <ParcelSetupWizard
        polygon={polygon}
        metrics={metrics}
        onCreated={handleCreated}
        onBack={() => setScreen('draw')}
      />
    );
  }

  if (screen === 'success') {
    return (
      <div className="space-y-6 text-center py-6">
        <h2 className="text-xl font-semibold">¡Parcela registrada!</h2>
        <p className="text-sm text-muted-foreground">
          {fieldsCreated} parcela{fieldsCreated !== 1 ? 's' : ''} creada{fieldsCreated !== 1 ? 's' : ''}.
          La sincronización satelital puede tardar unas horas.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {allowMultiple && (
            <Button variant="outline" className="min-h-[44px]" onClick={handleAddAnother}>
              Agregar otra parcela
            </Button>
          )}
          <Button className="min-h-[44px]" onClick={handleFinish}>
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
