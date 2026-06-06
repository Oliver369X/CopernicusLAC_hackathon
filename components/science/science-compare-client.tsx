'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFields } from '@/hooks/use-fields';
import type { MultisensorAnalysis } from '@/lib/science/types';
import type { ScienceCropId } from '@/lib/science/types';
import { Loader2, GitCompareArrows } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import {
  getCropLabelEs,
  healthLabelEs,
  type HealthLevel,
} from '@/lib/design/tokens';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { formatDecimal } from '@/lib/i18n/format-number';

const DEFAULT_CROPS: ScienceCropId[] = ['soybean', 'corn', 'wheat'];

const healthBadgeClass: Record<HealthLevel, string> = {
  excellent: 'bg-health-excellent',
  good: 'bg-health-good',
  warning: 'bg-health-warning',
  critical: 'bg-health-critical',
};

export default function ScienceCompareClient() {
  const searchParams = useSearchParams();
  const fieldId = searchParams.get('field') ?? 'field-sj-norte';
  const compareParam = searchParams.get('compare');
  const crops = (compareParam?.split(',') ?? DEFAULT_CROPS).filter(Boolean) as ScienceCropId[];
  const { fields, getFieldById } = useFields();
  const field = getFieldById(fieldId);
  const zoneId = field?.zones[0]?.id ?? '';
  const [analyses, setAnalyses] = useState<Record<string, MultisensorAnalysis | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!field || !zoneId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      crops.map(async (c) => {
        if (field.crop !== c) {
          return [c, null] as const;
        }
        const res = await fetch(
          `/api/science/${c}/analysis?fieldId=${fieldId}&zoneId=${zoneId}`
        );
        const { data } = await parseJsonResponse<MultisensorAnalysis>(res);
        return [c, data] as const;
      })
    ).then((pairs) => {
      const map: Record<string, MultisensorAnalysis | null> = {};
      for (const [c, a] of pairs) map[c] = a;
      setAnalyses(map);
      setLoading(false);
    });
  }, [field, fieldId, zoneId, crops.join(',')]);

  const demoFieldsForCrops = fields.filter((f) =>
    crops.includes(f.crop as ScienceCropId)
  );

  if (loading) {
    return (
      <PageContainer size="wide">
        <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando comparación…</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        description={
          field
            ? `Campo «${field.name}» (cultivo activo: ${getCropLabelEs(field.crop)}). El análisis completo solo aplica al cultivo del campo; los demás enlazan a sus laboratorios.`
            : 'Selecciona un campo con parámetro ?field= en la URL.'
        }
      />

      {!field && (
        <Card className="glass-card border-health-warning/30">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Campo no encontrado. Prueba{' '}
            <Link href="/science/compare?field=field-sj-norte" className="text-primary underline">
              field-sj-norte (soja)
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {crops.map((c) => {
          const a = analyses[c];
          const isActive = field?.crop === c;
          return (
            <Card key={c} className="glass-card min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <GitCompareArrows className="h-4 w-4 shrink-0 text-primary" />
                  {getCropLabelEs(c)}
                  {isActive && <Badge variant="secondary">cultivo del campo</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!isActive && (
                  <p className="leading-relaxed text-muted-foreground">
                    Este campo no es {getCropLabelEs(c)}. Abrí un lote de ese cultivo para ver el
                    score multisensor.
                  </p>
                )}
                {isActive && !a && (
                  <p className="text-muted-foreground">No se pudo cargar el análisis.</p>
                )}
                {a && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={healthBadgeClass[a.healthLabel as HealthLevel]}>
                        {healthLabelEs[a.healthLabel as HealthLevel] ?? a.healthLabel}
                      </Badge>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatDecimal(a.fusionScore * 100, 0)}%
                      </span>
                    </div>
                    {a.fusionScoreMl != null && (
                      <p className="text-muted-foreground">
                        ML: {formatDecimal(a.fusionScoreMl * 100, 0)}%
                        {a.healthLabelMl
                          ? ` (${healthLabelEs[a.healthLabelMl as HealthLevel] ?? a.healthLabelMl})`
                          : ''}
                      </p>
                    )}
                    <p className="tabular-nums text-muted-foreground">
                      NDRE {formatDecimal(a.optical.ndre, 2)} · DpRVI{' '}
                      {formatDecimal(a.radar.dpRvi, 2)}
                    </p>
                  </>
                )}
                <Button variant="outline" size="sm" className="h-9 w-full" asChild>
                  <Link href={`/science/${c}${isActive && field ? `?field=${fieldId}` : ''}`}>
                    Abrir laboratorio
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {demoFieldsForCrops.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Campos demo por cultivo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {demoFieldsForCrops.map((f) => (
              <Button key={f.id} variant="outline" size="sm" className="h-9" asChild>
                <Link href={`/science/compare?field=${f.id}&compare=${crops.join(',')}`}>
                  {f.name} ({getCropLabelEs(f.crop)})
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="h-10" asChild>
        <Link href="/science">← Volver al laboratorio</Link>
      </Button>
    </PageContainer>
  );
}
