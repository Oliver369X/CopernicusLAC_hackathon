'use client';

import { useState } from 'react';
import {
  FileDown,
  Loader2,
  Microscope,
  Satellite,
  ShieldAlert,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SpecialistDiagnosticReport } from '@/lib/diagnostics/types';
import { healthLabelEs } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';
import { downloadDiagnosticPdf } from '@/lib/reports/download-diagnostic-pdf-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DiagnosticSpecialistReportProps {
  report: SpecialistDiagnosticReport;
  className?: string;
}

export function DiagnosticSpecialistReport({
  report,
  className,
}: DiagnosticSpecialistReportProps) {
  const [exporting, setExporting] = useState(false);
  const healthLabel = healthLabelEs[report.overallHealth];

  async function handleExport() {
    setExporting(true);
    try {
      await downloadDiagnosticPdf(report);
      toast.success('Informe PDF descargado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar PDF');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="glass-card border-primary/30 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-primary shrink-0 sm:h-5 sm:w-5" />
                <p className="text-[10px] font-medium uppercase tracking-wide text-primary sm:text-xs">
                  Informe especialista
                </p>
              </div>
              <h2 className="text-base font-semibold leading-snug sm:text-lg">
                Diagnóstico — {report.cropLabel}
              </h2>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {report.fieldName} · {report.zoneName}
              </p>
              <p className="truncate font-mono text-[10px] text-muted-foreground/80">
                {report.reportId}
              </p>
            </div>
            <Button
              type="button"
              className="hidden h-11 min-h-[44px] shrink-0 sm:inline-flex"
              onClick={() => void handleExport()}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>

        <CardContent className="grid grid-cols-3 gap-1.5 px-3 pt-3 pb-3 sm:gap-3 sm:px-6 sm:pt-4 sm:pb-6">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-center sm:p-3">
            <p className="text-[9px] uppercase text-muted-foreground sm:text-[10px]">Salud</p>
            <p className="mt-0.5 text-xs font-semibold leading-tight sm:mt-1 sm:text-base">
              {healthLabel}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Índice</p>
            <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
              {formatDecimal(report.healthScore, 0)}%
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Riesgo</p>
            <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
              {formatDecimal(report.riskScore, 0)}/100
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Resumen ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {report.executiveSummary}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Satellite className="h-4 w-4 text-primary" />
            Correlación Copernicus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {report.satellite.ndvi != null && (
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">NDVI</p>
                <p className="font-semibold tabular-nums">
                  {formatDecimal(report.satellite.ndvi, 3)}
                </p>
              </div>
            )}
            {report.satellite.ndmi != null && (
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">NDMI</p>
                <p className="font-semibold tabular-nums">
                  {formatDecimal(report.satellite.ndmi, 3)}
                </p>
              </div>
            )}
            {report.satellite.ndre != null && (
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">NDRE</p>
                <p className="font-semibold tabular-nums">
                  {formatDecimal(report.satellite.ndre, 3)}
                </p>
              </div>
            )}
            {report.satellite.lst != null && (
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">LST S3</p>
                <p className="font-semibold tabular-nums">
                  {formatDecimal(report.satellite.lst, 1)}°C
                </p>
              </div>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {report.satellite.interpretation}
          </p>
        </CardContent>
      </Card>

      {report.findings.map((finding) => (
        <Card key={finding.detectionName} className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Microscope className="h-4 w-4 text-primary" />
                {finding.nameEs}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">{finding.confidencePct}% conf.</Badge>
                <Badge variant="outline">{finding.severityLabel}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="leading-relaxed text-muted-foreground">
              {finding.specialistNarrative}
            </p>
            {finding.knowledge && (
              <>
                <div>
                  <p className="mb-1 font-medium text-foreground">Agente causal</p>
                  <p className="text-muted-foreground">{finding.knowledge.causalAgent}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">Umbral económico</p>
                  <p className="text-muted-foreground">
                    {finding.knowledge.economicThreshold}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">Síntomas clave</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {finding.knowledge.symptoms.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                {finding.knowledge.criticalPhenology && (
                  <p className="text-xs text-muted-foreground">
                    Fenología crítica: {finding.knowledge.criticalPhenology}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="glass-card border-health-warning/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-health-warning" />
            Plan de manejo integrado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <section>
            <p className="mb-2 font-medium text-foreground">Inmediato (0–48 h)</p>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {report.managementPlan.immediate.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-2 font-medium text-foreground">Corto plazo (7–14 d)</p>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {report.managementPlan.shortTerm.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="mb-2 font-medium text-foreground">Preventivo</p>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {report.managementPlan.preventive.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </CardContent>
      </Card>

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">{report.disclaimer}</p>

      <div className="sticky bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-10 -mx-1 pb-1 sm:static sm:mx-0 sm:pb-0">
        <Button
          type="button"
          className="h-12 w-full shadow-lg shadow-primary/20 sm:hidden"
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Descargar informe PDF Aura
        </Button>
      </div>
    </div>
  );
}
