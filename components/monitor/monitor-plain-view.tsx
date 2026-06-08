'use client';

import Link from 'next/link';
import { AlertCircle, HelpCircle } from 'lucide-react';
import type { Field, FieldZone } from '@/lib/types/field';
import type { SatelliteData } from '@/lib/mock-data/satellite-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import FieldMap from '@/components/dashboard/field-map';
import { getCropLabelEs, healthColors, type HealthLevel } from '@/lib/design/tokens';
import { labelHealthPlain, labelMetricPlain } from '@/lib/i18n/plain-labels';
import { cn } from '@/lib/utils';

interface MonitorPlainViewProps {
  visibleFields: Field[];
  selectedField: Field;
  selectedZone: FieldZone | null;
  satelliteData: SatelliteData;
  satelliteSource: string;
  ndviScalar: number;
  ndmiScalar: number;
  activeAlerts: number;
  onFieldChange: (fieldId: string) => void;
  onZoneClick: (zone: FieldZone) => void;
}

function ndviToHealth(ndvi: number): HealthLevel {
  if (ndvi >= 0.65) return 'good';
  if (ndvi >= 0.45) return 'warning';
  return 'critical';
}

export function MonitorPlainView({
  visibleFields,
  selectedField,
  selectedZone,
  satelliteData,
  satelliteSource,
  ndviScalar,
  ndmiScalar,
  activeAlerts,
  onFieldChange,
  onZoneClick,
}: MonitorPlainViewProps) {
  const health = ndviToHealth(ndviScalar);

  return (
    <PageContainer size="wide" className="space-y-4">
      <PageHeader
        title="Mapa de mi parcela"
        description="Verde = bien · Amarillo = revisar · Rojo = problema"
        actions={
          visibleFields.length > 1 ? (
            <Select value={selectedField.id} onValueChange={onFieldChange}>
              <SelectTrigger className="h-11 w-full min-w-0 sm:w-[min(100%,280px)]">
                <SelectValue placeholder="Elegí parcela" />
              </SelectTrigger>
              <SelectContent>
                {visibleFields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} · {getCropLabelEs(field.crop)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      {activeAlerts > 0 && (
        <Card className="glass-card border-health-critical/30 bg-health-critical/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-health-critical" />
              <p className="text-sm font-medium">
                Tenés {activeAlerts} {activeAlerts === 1 ? 'aviso' : 'avisos'} sin leer
              </p>
            </div>
            <Button variant="outline" size="sm" className="min-h-[44px]" asChild>
              <Link href="/alerts">Ver avisos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card min-w-0 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Tu parcela
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground" aria-label="Ayuda">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                El color muestra cómo va tu cultivo según la última foto del satélite. Si ves
                amarillo o rojo varios días seguidos, conviene revisar en campo.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldMap
            field={selectedField}
            satelliteData={satelliteData}
            satelliteSource={satelliteSource}
            selectedZoneId={selectedZone?.id}
            onZoneClick={onZoneClick}
          />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-health-good" /> Bien
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-health-warning" /> Revisar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-health-critical" /> Problema
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="glass-card">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">{labelMetricPlain('ndvi')}</p>
            <Badge className={cn('mt-2', healthColors[health], 'text-white border-0')}>
              {labelHealthPlain(health)}
            </Badge>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">{labelMetricPlain('ndmi')}</p>
            <p className="mt-2 text-sm font-medium">
              {ndmiScalar >= 0.4 ? 'Humedad aceptable' : 'Puede estar seca'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Button asChild className="min-h-[48px] w-full" size="lg">
        <Link href={`/field/capture?field=${selectedField.id}&zoneId=${selectedZone?.id ?? ''}`}>
          Sacar una foto en campo
        </Link>
      </Button>
    </PageContainer>
  );
}
