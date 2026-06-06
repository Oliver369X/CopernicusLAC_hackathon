'use client';

import { useState } from 'react';
import type { Polygon } from 'geojson';
import { Loader2, Sprout, Wheat, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { useOrgBilling } from '@/hooks/use-org-billing';
import { getDefaultZoneSplit } from '@/lib/billing/plans';
import { formatDecimal } from '@/lib/i18n/format-number';
import { cn } from '@/lib/utils';
import type { CropType } from '@/lib/mock-data/crops';
import type { DrawingMetrics } from './drawing/drawing-types';

type WizardStep = 'crop' | 'details' | 'review';

const CROP_OPTIONS: { id: CropType; label: string; icon: typeof Sprout }[] = [
  { id: 'soybean', label: 'Soja', icon: Sprout },
  { id: 'wheat', label: 'Trigo', icon: Wheat },
  { id: 'corn', label: 'Maíz', icon: Leaf },
];

interface ParcelSetupWizardProps {
  polygon: Polygon;
  metrics: DrawingMetrics;
  onCreated: (result: { fieldId: string; zoneIds: string[] }) => void;
  onBack: () => void;
}

export function ParcelSetupWizard({
  polygon,
  metrics,
  onCreated,
  onBack,
}: ParcelSetupWizardProps) {
  const { billing, refresh: refreshBilling } = useOrgBilling();
  const [step, setStep] = useState<WizardStep>('crop');
  const [crop, setCrop] = useState<CropType | null>(null);
  const [name, setName] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [locationLabel, setLocationLabel] = useState('San Julián, Santa Cruz — Bolivia');
  const [loading, setLoading] = useState(false);

  const isCoop = billing?.billingModel === 'zone';
  const zoneSplit = isCoop ? getDefaultZoneSplit('zone') : 1;
  const projectedHa = (billing?.totalHa ?? 0) + metrics.areaHa;
  const usagePercent = billing
    ? Math.min(100, (projectedHa / billing.hectareLimit) * 100)
    : 0;

  async function handleCreate() {
    if (!crop || name.trim().length < 2) return;
    setLoading(true);
    const res = await fetch('/api/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        crop_type: crop,
        bounds: polygon,
        planting_date: plantingDate || undefined,
        location_label: locationLabel || undefined,
      }),
    });
    setLoading(false);

    const { data, error } = await parseJsonResponse<{
      fieldId?: string;
      zoneIds?: string[];
      error?: string;
    }>(res);

    if (!res.ok) {
      toast.error(data?.error ?? error ?? 'No se pudo crear la parcela');
      return;
    }

    if (data?.fieldId && data.zoneIds) {
      await refreshBilling();
      toast.success(`Parcela "${name.trim()}" creada`);
      onCreated({ fieldId: data.fieldId, zoneIds: data.zoneIds });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['crop', 'details', 'review'] as WizardStep[]).map((s) => (
          <div
            key={s}
            className={cn(
              'h-1 flex-1 rounded-full',
              step === s || (['details', 'review'].includes(step) && s === 'crop')
                ? 'bg-primary'
                : 'bg-muted',
              step === 'review' && s !== 'review' ? 'bg-primary/60' : ''
            )}
          />
        ))}
      </div>

      {step === 'crop' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">¿Qué cultivás?</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CROP_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = crop === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCrop(opt.id)}
                  className={cn(
                    'min-h-[44px] rounded-lg border-2 p-4 text-left transition-colors',
                    selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-muted/40'
                  )}
                >
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium">{opt.label}</p>
                </button>
              );
            })}
          </div>
          <Button
            className="w-full min-h-[44px]"
            disabled={!crop}
            onClick={() => setStep('details')}
          >
            Continuar
          </Button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Datos de la parcela</h2>
          <div className="space-y-2">
            <Label htmlFor="parcel-name">Nombre</Label>
            <Input
              id="parcel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chacra Norte"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planting-date">Fecha de siembra (opcional)</Label>
            <Input
              id="planting-date"
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-label">Ubicación (opcional)</Label>
            <Input
              id="location-label"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setStep('crop')}>
              Atrás
            </Button>
            <Button
              className="flex-1 min-h-[44px]"
              disabled={name.trim().length < 2}
              onClick={() => setStep('review')}
            >
              Revisar
            </Button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Revisión</h2>
          <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nombre:</span> {name}
            </p>
            <p>
              <span className="text-muted-foreground">Cultivo:</span>{' '}
              {CROP_OPTIONS.find((c) => c.id === crop)?.label}
            </p>
            <p>
              <span className="text-muted-foreground">Área:</span>{' '}
              {formatDecimal(metrics.areaHa)} ha
            </p>
            {isCoop && (
              <p className="text-xs text-muted-foreground">
                Se crearán {zoneSplit} subzonas automáticas en esta parcela.
              </p>
            )}
          </div>

          {billing && (
            <div className="space-y-2 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">
                Usás {formatDecimal(projectedHa)} de {formatDecimal(billing.hectareLimit)} ha
              </p>
              <Progress value={usagePercent} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setStep('details')}>
              Atrás
            </Button>
            <Button
              className="flex-1 min-h-[44px]"
              disabled={loading}
              onClick={() => void handleCreate()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando…
                </>
              ) : (
                'Crear parcela'
              )}
            </Button>
          </div>
        </div>
      )}

      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Volver al mapa
      </Button>
    </div>
  );
}
