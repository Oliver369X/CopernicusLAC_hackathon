'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';
import type { PatchSelection } from '@/lib/geo/patch-selection';

function healthFromNdvi(ndvi: number): HealthLevel {
  if (ndvi > 0.6) return 'excellent';
  if (ndvi > 0.4) return 'good';
  if (ndvi > 0.2) return 'warning';
  return 'critical';
}

function recommendation(ndvi: number, ndmi: number): string {
  if (ndvi < 0.35) {
    return 'Vigor bajo en este punto: revisá riego, compactación o posible plaga localizada.';
  }
  if (ndmi < 0.3) {
    return 'Humedad baja en el suelo: considerá riego puntual en esta zona del lote.';
  }
  if (ndvi > 0.65) {
    return 'Buen vigor en este rincón — podés usarlo como referencia del resto de la parcela.';
  }
  return 'Condición estable. Monitoreá en los próximos días si hay cambio de color en el cultivo.';
}

interface PatchAnalysisDialogProps {
  patch: PatchSelection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneName: string;
  sceneDate?: string | null;
  isRealGrid?: boolean;
}

export function PatchAnalysisDialog({
  patch,
  open,
  onOpenChange,
  zoneName,
  sceneDate,
  isRealGrid,
}: PatchAnalysisDialogProps) {
  if (!patch) return null;

  const health = healthFromNdvi(patch.ndvi);
  const advice = recommendation(patch.ndvi, patch.ndmi);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Análisis del punto seleccionado</DialogTitle>
          <DialogDescription>
            {zoneName} · {formatDecimal(patch.lat, 5)}°, {formatDecimal(patch.lng, 5)}°
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {isRealGrid ? 'Copernicus S2' : 'Estimado del lote'}
          </Badge>
          {sceneDate && (
            <Badge variant="outline" className="text-xs">
              Escena {new Date(sceneDate).toLocaleDateString('es-BO')}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">NDVI (punto)</p>
            <p className="text-lg font-semibold">{formatDecimal(patch.ndvi, 2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">NDMI (punto)</p>
            <p className="text-lg font-semibold">{formatDecimal(patch.ndmi, 2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Promedio 3×3</p>
            <p className="text-lg font-semibold">{formatDecimal(patch.ndviAvg3, 2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Salud local</p>
            <p className="text-lg font-semibold">{healthLabelEs[health]}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{advice}</p>
      </DialogContent>
    </Dialog>
  );
}
