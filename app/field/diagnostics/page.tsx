'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getObservation } from '@/lib/offline-storage';
import type { CorrelationAnalysis } from '@/lib/mock-data/vision-analyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  TrendingUp,
  Leaf,
  Loader2,
} from 'lucide-react';
import { FieldPageIntro } from '@/components/field/field-page-intro';
import { formatDecimal } from '@/lib/i18n/format-number';
import {
  labelDiseaseName,
  labelObservationSeverity,
  labelOverallHealth,
} from '@/lib/i18n/observation-labels';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { cn } from '@/lib/utils';

type SatelliteContext = {
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  stressPattern?: string;
  source?: string;
  s3Lst?: number | null;
  s1MoistureIndex?: number | null;
};

function DiagnosticsContent() {
  const searchParams = useSearchParams();
  const observationId = searchParams.get('observationId');
  const [loading, setLoading] = useState(!!observationId);
  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [satelliteContext, setSatelliteContext] = useState<SatelliteContext | null>(null);
  const [disclaimer, setDisclaimer] = useState('');

  useEffect(() => {
    async function runAnalysis() {
      if (!observationId) {
        setLoading(false);
        return;
      }

      const local = await getObservation(observationId);
      if (!local?.imageData) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/diagnostics/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            observationId,
            imageData: local.imageData,
            fieldId: local.fieldId,
            zoneId: local.zoneId,
          }),
        });
        const { data } = await parseJsonResponse<{
          correlation?: CorrelationAnalysis;
          disclaimer?: string;
          satelliteContext?: SatelliteContext;
        }>(res);
        if (data?.correlation) {
          setAnalysis(data.correlation);
          setDisclaimer(data.disclaimer ?? '');
          if (data.satelliteContext) setSatelliteContext(data.satelliteContext);
        }
      } finally {
        setLoading(false);
      }
    }
    runAnalysis();
  }, [observationId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Analizando imagen con IA...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-4 pb-4">
        <FieldPageIntro
          title="Sin diagnóstico aún"
          description="Capturá una foto del cultivo para obtener análisis de visión e índices satelitales."
        />
        <div className="px-4 text-center">
          <Zap className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-30" />
          <Button asChild className="h-11">
            <Link href="/field/capture">Ir a captura</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isHealthy =
    analysis.overallHealth === 'excellent' || analysis.overallHealth === 'good';

  return (
    <div className="space-y-4 pb-4">
      <FieldPageIntro
        title={labelOverallHealth(analysis.overallHealth)}
        description="Resultado combinado: visión en campo + contexto Copernicus"
      />

      <div className="space-y-3 px-4">
        {disclaimer && (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{disclaimer}</p>
        )}

        <Card
          className={cn(
            'glass-card',
            isHealthy ? 'border-health-excellent/30' : 'border-health-warning/30'
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {isHealthy ? (
                <CheckCircle2 className="h-5 w-5 text-health-excellent" />
              ) : (
                <AlertCircle className="h-5 w-5 text-health-warning" />
              )}
              Resumen del lote
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:text-base">
            <div>
              <p className="text-muted-foreground">Índice de salud</p>
              <p className="font-semibold tabular-nums">
                {formatDecimal(analysis.healthScore, 0)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Confianza</p>
              <p className="font-semibold tabular-nums">
                {formatDecimal(analysis.confidence, 0)}%
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Riesgo agregado</p>
              <p className="font-semibold tabular-nums">
                {formatDecimal(analysis.riskScore, 0)}/100
              </p>
            </div>
          </CardContent>
        </Card>

        {analysis.detectedDiseases.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Leaf className="h-4 w-4" />
                Hallazgos detectados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.detectedDiseases.map((d) => (
                <div
                  key={d.disease}
                  className="rounded-lg border border-border/60 p-3 text-sm"
                >
                  <p className="font-medium text-foreground">{labelDiseaseName(d.disease)}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Confianza {formatDecimal(d.confidence * 100, 0)}% · Severidad{' '}
                    {labelObservationSeverity(d.severity)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {satelliteContext && (
          <Card className="glass-card border-primary/25">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Contexto satélite Copernicus
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">NDVI</span>
                <p className="font-semibold tabular-nums">
                  {formatDecimal(satelliteContext.ndvi, 2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">NDMI</span>
                <p className="font-semibold tabular-nums">
                  {formatDecimal(satelliteContext.ndmi, 2)}
                </p>
              </div>
              {satelliteContext.ndre != null && (
                <div>
                  <span className="text-muted-foreground">NDRE</span>
                  <p className="font-semibold tabular-nums">
                    {formatDecimal(satelliteContext.ndre, 2)}
                  </p>
                </div>
              )}
              {satelliteContext.s3Lst != null && (
                <div>
                  <span className="text-muted-foreground">LST (S3)</span>
                  <p className="font-semibold tabular-nums">
                    {formatDecimal(satelliteContext.s3Lst, 1)}°C
                  </p>
                </div>
              )}
              {satelliteContext.s1MoistureIndex != null && (
                <div>
                  <span className="text-muted-foreground">Humedad S1</span>
                  <p className="font-semibold tabular-nums">
                    {formatDecimal(satelliteContext.s1MoistureIndex * 100, 0)}%
                  </p>
                </div>
              )}
              {satelliteContext.stressPattern && (
                <div className="col-span-2 text-sm text-muted-foreground">
                  Patrón: {satelliteContext.stressPattern}
                  {satelliteContext.source ? ` · ${satelliteContext.source}` : ''}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {analysis.satelliteInsights.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Correlación satelital</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {analysis.satelliteInsights.map((insight) => (
                  <li key={insight} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.combinedRecommendations.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {analysis.combinedRecommendations.map((rec) => (
                  <li key={rec} className="flex gap-2">
                    <span className="text-primary">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function Diagnostics() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
      }
    >
      <DiagnosticsContent />
    </Suspense>
  );
}
