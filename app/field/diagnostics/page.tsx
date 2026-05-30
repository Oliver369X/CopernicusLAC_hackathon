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

function DiagnosticsContent() {
  const searchParams = useSearchParams();
  const observationId = searchParams.get('observationId');
  const [loading, setLoading] = useState(!!observationId);
  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [satelliteContext, setSatelliteContext] = useState<{
    ndvi: number;
    ndmi: number;
    ndre?: number | null;
    stressPattern?: string;
    source?: string;
    s3Lst?: number | null;
    s1MoistureIndex?: number | null;
  } | null>(null);
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
        const data = await res.json();
        if (data.correlation) {
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
      <div className="p-8 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Analizando imagen con IA...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 space-y-4 pb-4">
        <div className="text-center space-y-4 py-8">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
          <h2 className="text-lg font-bold">No Diagnosis Available</h2>
          <p className="text-sm text-muted-foreground">
            Take a photo from the Capture tab to get AI analysis
          </p>
          <Button asChild variant="outline">
            <Link href="/field/capture">Go to Capture</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isHealthy =
    analysis.overallHealth === 'excellent' || analysis.overallHealth === 'good';

  return (
    <div className="p-4 space-y-4 pb-4">
      {disclaimer && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
          {disclaimer}
        </p>
      )}

      <Card className={isHealthy ? 'border-health-excellent/30' : 'border-health-warning/30'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {isHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-health-excellent" />
            ) : (
              <AlertCircle className="h-5 w-5 text-health-warning" />
            )}
            Overall Health: {analysis.overallHealth}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Health Score: {analysis.healthScore}%</div>
            <div>Confidence: {analysis.confidence}%</div>
            <div>Risk Score: {analysis.riskScore}/100</div>
          </div>
        </CardContent>
      </Card>

      {analysis.detectedDiseases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Detected Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.detectedDiseases.map((d) => (
              <div key={d.disease} className="border rounded-lg p-3 text-sm">
                <p className="font-medium">{d.disease}</p>
                <p className="text-muted-foreground text-xs">
                  Confidence: {(d.confidence * 100).toFixed(0)}% · {d.severity}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {satelliteContext && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Contexto satélite Copernicus
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>NDVI: {satelliteContext.ndvi.toFixed(2)}</div>
            <div>NDMI: {satelliteContext.ndmi.toFixed(2)}</div>
            {satelliteContext.ndre != null && (
              <div>NDRE: {satelliteContext.ndre.toFixed(2)}</div>
            )}
            {satelliteContext.s3Lst != null && (
              <div>LST S3: {satelliteContext.s3Lst.toFixed(1)}°C</div>
            )}
            {satelliteContext.s1MoistureIndex != null && (
              <div>S1 humedad: {(satelliteContext.s1MoistureIndex * 100).toFixed(0)}%</div>
            )}
            {satelliteContext.stressPattern && (
              <div className="col-span-2 text-muted-foreground text-xs">
                Patrón: {satelliteContext.stressPattern} · {satelliteContext.source}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {analysis.satelliteInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Satellite Correlation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {analysis.satelliteInsights.map((insight) => (
                <li key={insight}>• {insight}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysis.combinedRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
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
  );
}

export default function Diagnostics() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-sm">Loading...</div>}>
      <DiagnosticsContent />
    </Suspense>
  );
}
