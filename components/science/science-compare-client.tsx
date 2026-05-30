'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFields } from '@/hooks/use-fields';
import type { MultisensorAnalysis } from '@/lib/science/types';
import type { ScienceCropId } from '@/lib/science/types';
import { Loader2 } from 'lucide-react';

const DEFAULT_CROPS: ScienceCropId[] = ['soybean', 'corn', 'wheat'];

export default function ScienceCompareClient() {
  const searchParams = useSearchParams();
  const fieldId = searchParams.get('field') ?? 'field-1';
  const compareParam = searchParams.get('compare');
  const crops = (compareParam?.split(',') ?? DEFAULT_CROPS).filter(Boolean) as ScienceCropId[];
  const { getFieldById } = useFields();
  const field = getFieldById(fieldId);
  const zoneId = field?.zones[0]?.id ?? '';
  const [analyses, setAnalyses] = useState<Record<string, MultisensorAnalysis | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!field || !zoneId) return;
    setLoading(true);
    Promise.all(
      crops.map(async (c) => {
        if (field.crop !== c) {
          return [c, null] as const;
        }
        const res = await fetch(
          `/api/science/${c}/analysis?fieldId=${fieldId}&zoneId=${zoneId}`
        );
        const data = await res.json();
        return [c, data as MultisensorAnalysis] as const;
      })
    ).then((pairs) => {
      const map: Record<string, MultisensorAnalysis | null> = {};
      for (const [c, a] of pairs) map[c] = a;
      setAnalyses(map);
      setLoading(false);
    });
  }, [field, fieldId, zoneId, crops.join(',')]);

  if (loading) {
    return (
      <div className="p-6 flex gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando comparación…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Comparar cultivos</h1>
      <p className="text-sm text-muted-foreground">
        Campo {field?.name ?? fieldId} · misma zona/fecha satelital. Solo el cultivo del campo muestra análisis completo.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {crops.map((c) => {
          const a = analyses[c];
          return (
            <Card key={c}>
              <CardHeader>
                <CardTitle className="text-base capitalize flex items-center gap-2">
                  {c}
                  {field?.crop === c && <Badge variant="secondary">activo</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {!a && <p className="text-muted-foreground">Campo no es {c}</p>}
                {a && (
                  <>
                    <p>Score reglas: {(a.fusionScore * 100).toFixed(0)}% ({a.healthLabel})</p>
                    {a.fusionScoreMl != null && (
                      <p>ML: {(a.fusionScoreMl * 100).toFixed(0)}% ({a.healthLabelMl})</p>
                    )}
                    <p className="text-xs">NDRE {a.optical.ndre?.toFixed(3)} · DpRVI {a.radar.dpRvi?.toFixed(3)}</p>
                    <Link href={`/science/${c}?field=${fieldId}`} className="text-primary underline text-xs">
                      Abrir lab →
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Link href="/science" className="text-sm text-primary underline">← Volver al hub</Link>
    </div>
  );
}
