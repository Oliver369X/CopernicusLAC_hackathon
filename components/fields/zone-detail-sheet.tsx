'use client';

import Link from 'next/link';
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
import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';
import { useOrgBilling } from '@/hooks/use-org-billing';
import { isSmallFarmerExperience } from '@/lib/navigation/experience';

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
  const { billing } = useOrgBilling();
  const simpleMode = isSmallFarmerExperience(billing);

  if (!zone || !field) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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

        <SheetFooter>
          <Button asChild className="w-full">
            <Link href={`/monitor?field=${field.id}&zone=${zone.id}`}>
              Abrir en monitor
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
