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
import { Badge } from '@/components/ui/badge';
import { FieldPolygonPreview } from '@/components/fields/field-polygon-preview';
import { getCropLabelEs, healthLabelEs, type HealthLevel } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import { labelHealthPlain } from '@/lib/i18n/plain-labels';

interface FieldDetailSheetProps {
  field: Field | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onZoneSelect?: (zone: FieldZone) => void;
}

export function FieldDetailSheet({
  field,
  open,
  onOpenChange,
  onZoneSelect,
}: FieldDetailSheetProps) {
  const { plain } = usePlainExperience();
  if (!field) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{field.name}</SheetTitle>
          <SheetDescription className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">{getCropLabelEs(field.crop)}</Badge>
            <Badge variant="outline">
              {plain
                ? labelHealthPlain(field.overallHealth as HealthLevel)
                : `Salud: ${healthLabelEs[field.overallHealth as HealthLevel]}`}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <FieldPolygonPreview bounds={field.bounds} zones={field.zones} height={180} />

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground text-xs">Área</p>
              <p className="font-semibold">{formatDecimal(field.area)} ha</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground text-xs">Zonas</p>
              <p className="font-semibold">{field.zones.length}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="text-muted-foreground text-xs">Riesgo</p>
              <p className="font-semibold">{field.riskScore}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{plain ? 'Partes de la parcela' : 'Zonas de manejo'}</p>
            {field.zones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin zonas registradas.</p>
            ) : (
              <ul className="space-y-2">
                {field.zones.map((zone) => (
                  <li key={zone.id}>
                    <button
                      type="button"
                      onClick={() => onZoneSelect?.(zone)}
                      className="flex w-full min-h-[44px] items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{zone.name}</span>
                      <span className="text-muted-foreground">
                        {formatDecimal(zone.area)} ha
                        {plain
                          ? ` · ${labelHealthPlain(zone.health as HealthLevel)}`
                          : ` · NDVI ${formatDecimal(zone.ndviAverage, 2)}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button asChild className="w-full">
            <Link href={`/monitor?field=${field.id}`}>Ver en monitor</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
