'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InsightPayload {
  summaryEs: string;
  actions: string[];
  phenologyHint?: string | null;
  sources: string[];
}

export function ZoneInsightCard({ zoneId }: { zoneId: string | null }) {
  const [insight, setInsight] = useState<InsightPayload | null>(null);

  useEffect(() => {
    if (!zoneId) {
      setInsight(null);
      return;
    }
    fetch(`/api/zones/${zoneId}/insight`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInsight(data))
      .catch(() => setInsight(null));
  }, [zoneId]);

  if (!zoneId || !insight) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resumen agronómico</CardTitle>
        {insight.phenologyHint && (
          <Badge variant="outline" className="w-fit text-xs">
            {insight.phenologyHint}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{insight.summaryEs}</p>
        <ul className="list-disc pl-4 space-y-1">
          {insight.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="text-xs opacity-70">
          Fuentes: {insight.sources.join(' · ')}
        </p>
      </CardContent>
    </Card>
  );
}
