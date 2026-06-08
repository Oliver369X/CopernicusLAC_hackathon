'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Alert } from '@/lib/alerts/alert-engine';
import { labelAlertType, labelAlertSeverity } from '@/lib/i18n/labels';
import { formatDateTimeEs } from '@/lib/i18n/format-date';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';

function severityBadgeVariant(severity: string) {
  if (severity === 'critical') return 'destructive' as const;
  if (severity === 'warning') return 'warning' as const;
  return 'secondary' as const;
}

function AlertTypeIcon({ type }: { type: Alert['type'] }) {
  const className = 'h-5 w-5 shrink-0';
  switch (type) {
    case 'disease':
      return <AlertCircle className={className} />;
    case 'threshold':
      return <Zap className={className} />;
    case 'predictive':
      return <Clock className={className} />;
    default:
      return <Bell className={className} />;
  }
}

export interface AlertListCardProps {
  alert: Alert;
  fieldLabel: string;
  zoneLabel: string;
  onResolve?: (id: string) => void;
  plain?: boolean;
}

export function AlertListCard({
  alert,
  fieldLabel,
  zoneLabel,
  onResolve,
  plain = false,
}: AlertListCardProps) {
  return (
    <Card
      className={cn(
        'glass-card border-l-4',
        alert.resolved
          ? 'border-l-border opacity-80'
          : alert.severity === 'critical'
            ? 'border-l-health-critical'
            : alert.severity === 'warning'
              ? 'border-l-health-warning'
              : 'border-l-primary'
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                alert.severity === 'critical'
                  ? 'bg-health-critical/15 text-health-critical'
                  : 'bg-health-warning/15 text-health-warning'
              )}
            >
              <AlertTypeIcon type={alert.type} />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                  {alert.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={severityBadgeVariant(alert.severity)} className="shrink-0">
                    {labelAlertSeverity(alert.severity, plain)}
                  </Badge>
                  {!plain && (
                    <Badge variant="outline" className="shrink-0">
                      {labelAlertType(alert.type, plain)}
                    </Badge>
                  )}
                  {alert.resolved && (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Resuelta
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {alert.description}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{plain ? 'Parcela' : 'Campo'}: {fieldLabel}</span>
                {!plain && <span>Zona: {zoneLabel}</span>}
              </div>
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm leading-relaxed">
                <span className="font-medium text-primary">
                  {plain ? 'Qué podés hacer: ' : 'Acción recomendada: '}
                </span>
                <span className="text-foreground">{alert.recommendation}</span>
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatDateTimeEs(alert.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            {plain && (
              <Button size="sm" className="h-10 min-h-[44px] w-full sm:w-auto" asChild>
                <Link
                  href={`/field/capture?field=${alert.fieldId}&zoneId=${alert.zoneId}`}
                >
                  Ir a ver
                </Link>
              </Button>
            )}
            {!alert.resolved && onResolve && (
              <Button
                size="sm"
                variant="outline"
                className="h-10 min-h-[44px] w-full sm:w-auto"
                onClick={() => onResolve(alert.id)}
              >
                {plain ? 'Ya lo revisé' : 'Marcar resuelta'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
