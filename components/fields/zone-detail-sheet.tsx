'use client';

import { useMemo, useState } from 'react';
import type { Field, FieldZone } from '@/lib/types/field';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ZoneInteractiveMap } from '@/components/fields/zone-interactive-map';
import { ZoneInsightCard } from '@/components/monitor/zone-insight-card';
import { AuraAssistantPanel } from '@/components/agents/aura-assistant-panel';
import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import { ASSISTANT_NAME } from '@/lib/constants/app-brand';
import { buildScreenContext } from '@/lib/agents/screen-context';
import { Sparkles } from 'lucide-react';

interface ZoneDetailSheetProps {
  zone: FieldZone | null;
  field: Field | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZoneDetailSheet({
  zone,
  field,
  open,
  onOpenChange,
}: ZoneDetailSheetProps) {
  const { plain: simpleMode } = usePlainExperience();
  const [askAura, setAskAura] = useState(false);

  const screenContext = useMemo(() => {
    if (!field || !zone) return undefined;
    return buildScreenContext('/monitor', { field: field.id, zone: zone.id });
  }, [field, zone]);

  const quickPrompts = useMemo(() => {
    if (!field || !zone) return [];
    return [
      `¿Qué significa NDVI ${formatDecimal(zone.ndviAverage, 2)} aquí?`,
      simpleMode ? '¿Mi parcela está bien?' : '¿Esta zona necesita riego?',
      'Generar informe fitosanitario de esta zona',
      'Informe histórico de 3 años',
      'Informe de seguridad alimentaria',
    ];
  }, [field, zone, simpleMode]);

  if (!zone || !field) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setAskAura(false);
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {field.name} → {zone.name}
          </SheetTitle>
          <SheetDescription>
            {simpleMode
              ? 'Mapa satelital de la parcela — tocá un punto para ver el análisis de esa zona pequeña'
              : 'Imagen Copernicus + grilla NDVI — seleccioná un sublote para análisis puntual'}
          </SheetDescription>
        </SheetHeader>

        {!askAura ? (
          <div className="space-y-4 py-4">
            <ZoneInteractiveMap field={field} zone={zone} height={220} />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Área</p>
                <p className="font-semibold">{formatDecimal(zone.area)} ha</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">NDVI</p>
                <p className="font-semibold">{formatDecimal(zone.ndviAverage, 2)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">NDMI</p>
                <p className="font-semibold">{formatDecimal(zone.ndmiAverage, 2)}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Salud</p>
                <p className="font-semibold">
                  {healthLabelEs[zone.health as HealthLevel]}
                </p>
              </div>
            </div>

            {zone.diseaseRisks.length > 0 && (
              <div className="rounded-md border border-health-warning/40 bg-health-warning/5 p-3 text-sm">
                <p className="font-medium text-health-warning mb-1">Riesgos detectados</p>
                <ul className="list-disc pl-4 text-muted-foreground">
                  {zone.diseaseRisks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            <ZoneInsightCard zoneId={zone.id} />
          </div>
        ) : (
          <div className="py-3">
            <p className="mb-3 text-xs text-muted-foreground">
              {ASSISTANT_NAME} responde solo con datos de <strong>{field.name}</strong> ·{' '}
              {zone.name} (tu cuenta, sin mezclar otras fincas).
            </p>
            <AuraAssistantPanel
              bare
              fieldId={field.id}
              zoneId={zone.id}
              screenContext={screenContext}
              quickPrompts={quickPrompts}
              autoPrompt={`Explicá el estado actual de ${zone.name} y qué debería hacer la productora.`}
            />
          </div>
        )}

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {!askAura ? (
            <Button className="w-full gap-2" onClick={() => setAskAura(true)}>
              <Sparkles className="h-4 w-4" />
              Preguntar a {ASSISTANT_NAME}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setAskAura(false)}>
              Volver a métricas
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
