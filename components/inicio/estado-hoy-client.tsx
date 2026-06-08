'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Map,
  Camera,
  Bell,
  Sprout,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useFields } from '@/hooks/use-fields';
import { useAlerts } from '@/hooks/use-alerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { SatelliteSyncProgressPlain } from '@/components/onboarding/satellite-sync-progress-plain';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { getCropLabelEs, healthColors, type HealthLevel } from '@/lib/design/tokens';
import {
  cropStatusSentence,
  formatSatelliteReadPlain,
  labelHealthPlain,
} from '@/lib/i18n/plain-labels';
import { isScienceCrop } from '@/lib/science/crops/registry';
import { cn } from '@/lib/utils';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';

interface FieldMetricsResponse {
  readingDate?: string | null;
  satellitePending?: boolean;
  source?: string;
  metrics?: { ndvi?: number | null };
}

interface AnalysisSnippet {
  narrative?: string;
  healthLabel?: HealthLevel;
}

function healthIcon(level: HealthLevel | null) {
  if (!level || level === 'excellent' || level === 'good') {
    return <CheckCircle2 className="h-8 w-8 text-health-good" />;
  }
  if (level === 'warning') {
    return <Info className="h-8 w-8 text-health-warning" />;
  }
  return <AlertTriangle className="h-8 w-8 text-health-critical" />;
}

function ndviToHealth(ndvi: number | null | undefined): HealthLevel {
  if (ndvi == null || Number.isNaN(ndvi)) return 'warning';
  if (ndvi >= 0.65) return 'good';
  if (ndvi >= 0.45) return 'warning';
  return 'critical';
}

export function EstadoHoyClient() {
  const { fields, loading: fieldsLoading } = useFields();
  const { alerts } = useAlerts();
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [metrics, setMetrics] = useState<FieldMetricsResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisSnippet | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId) ?? fields[0],
    [fields, selectedFieldId]
  );

  const zone = selectedField?.zones[0];

  useEffect(() => {
    if (fields.length && !selectedFieldId) {
      setSelectedFieldId(fields[0].id);
    }
  }, [fields, selectedFieldId]);

  const loadFieldData = useCallback(async () => {
    if (!selectedField || !zone) return;
    setLoadingDetail(true);
    try {
      const metricsRes = await fetch(
        `/api/fields/${selectedField.id}/metrics?zoneId=${zone.id}`
      );
      const { data: metricsData } = await parseJsonResponse<FieldMetricsResponse>(metricsRes);
      setMetrics(metricsData ?? null);

      if (isScienceCrop(selectedField.crop)) {
        const analysisRes = await fetch(
          `/api/science/${selectedField.crop}/analysis?fieldId=${selectedField.id}&zoneId=${zone.id}`
        );
        const { data: analysisData } = await parseJsonResponse<AnalysisSnippet>(analysisRes);
        setAnalysis(analysisData ?? null);
      } else {
        setAnalysis(null);
      }
    } catch {
      setMetrics(null);
      setAnalysis(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedField, zone]);

  useEffect(() => {
    void loadFieldData();
  }, [loadFieldData]);

  const activeAlerts = useMemo(() => {
    if (!selectedField) return [];
    return alerts.filter((a) => !a.resolved && a.fieldId === selectedField.id);
  }, [alerts, selectedField]);

  const health: HealthLevel = useMemo(() => {
    if (analysis?.healthLabel) return analysis.healthLabel;
    const ndvi = metrics?.metrics?.ndvi ?? zone?.ndviAverage;
    return ndviToHealth(ndvi);
  }, [analysis, zone, metrics]);

  const cropLabel = selectedField ? getCropLabelEs(selectedField.crop) : 'cultivo';
  const statusLine = cropStatusSentence(cropLabel, health);
  const narrative =
    analysis?.narrative ??
    (health === 'good' || health === 'excellent'
      ? 'Tu parcela se ve estable según la última lectura disponible.'
      : health === 'warning'
        ? 'Hay señales de que conviene revisar tu parcela esta semana.'
        : 'Hay señales urgentes — te recomendamos revisar pronto.');

  const lastRead = formatSatelliteReadPlain(metrics?.readingDate ?? null);
  const hasRealRead =
    Boolean(metrics?.readingDate) &&
    metrics?.source !== 'mock' &&
    !metrics?.satellitePending;

  if (fieldsLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando…
        </div>
      </PageContainer>
    );
  }

  if (!fields.length) {
    return (
      <PageContainer>
        <PageHeader title="Tu finca hoy" description="Empezá marcando tu parcela en el mapa." />
        <Card className="glass-card border-primary/25">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Sprout className="h-12 w-12 text-primary" />
            <p className="text-sm text-muted-foreground max-w-sm">
              Todavía no tenés parcelas registradas. Marcá tu chacra en el mapa para que el
              satélite pueda mirarla.
            </p>
            <Button asChild size="lg" className="min-h-[44px]">
              <Link href="/setup/parcel">Marcá tu parcela en el mapa</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <WelcomeModal />
      <PageHeader
        title="Tu finca hoy"
        description="Un resumen simple de cómo va tu parcela."
      />

      {fields.length > 1 && selectedField && (
        <Select value={selectedField.id} onValueChange={setSelectedFieldId}>
          <SelectTrigger className="h-11 max-w-xs">
            <SelectValue placeholder="Elegí parcela" />
          </SelectTrigger>
          <SelectContent>
            {fields.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {fields.length === 1 && selectedField && (
        <p className="text-sm text-muted-foreground">
          Parcela: <strong className="text-foreground">{selectedField.name}</strong>
        </p>
      )}

      <SatelliteSyncProgressPlain />

      <Card
        className={cn(
          'glass-card border-2',
          health === 'critical' && 'border-health-critical/50',
          health === 'warning' && 'border-health-warning/40',
          (health === 'good' || health === 'excellent') && 'border-health-good/30'
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-4">
            {loadingDetail ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" />
            ) : (
              healthIcon(health)
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl sm:text-2xl leading-tight">{statusLine}</CardTitle>
              <Badge
                className={cn('mt-2', healthColors[health], 'text-white border-0')}
                variant="secondary"
              >
                {labelHealthPlain(health)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{narrative}</p>
          <p className="text-xs text-muted-foreground">{lastRead}</p>
          {!hasRealRead && !loadingDetail && (
            <p className="text-xs rounded-md bg-muted/40 px-3 py-2 text-muted-foreground">
              Estamos esperando la primera foto del satélite de tu parcela.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button asChild size="lg" variant="default" className="min-h-[48px] h-auto py-3">
          <Link href={`/monitor?field=${selectedField?.id}&zone=${zone?.id}`}>
            <Map className="h-4 w-4 mr-2 shrink-0" />
            Ver en el mapa
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-[48px] h-auto py-3">
          <Link href={`/field/capture?field=${selectedField?.id}&zoneId=${zone?.id}`}>
            <Camera className="h-4 w-4 mr-2 shrink-0" />
            Sacar una foto
          </Link>
        </Button>
        {activeAlerts.length > 0 ? (
          <Button asChild size="lg" variant="outline" className="min-h-[48px] h-auto py-3">
            <Link href="/alerts">
              <Bell className="h-4 w-4 mr-2 shrink-0" />
              Ver avisos
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="ghost" className="min-h-[48px] h-auto py-3">
            <Link href="/science">
              <Sprout className="h-4 w-4 mr-2 shrink-0" />
              Cómo va mi cultivo
            </Link>
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
