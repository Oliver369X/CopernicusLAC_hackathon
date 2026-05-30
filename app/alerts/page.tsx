'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAlerts } from '@/hooks/use-alerts';
import { getFieldNameMap } from '@/lib/mock-data/fields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { KpiStat } from '@/components/layout/kpi-stat';
import { AlertCircle, Bell, CheckCircle2, Zap, Clock, Filter, Settings } from 'lucide-react';

const FIELD_NAMES = getFieldNameMap();

export default function AlertsPage() {
  const { alerts, stats, resolveAlert, source } = useAlerts();
  const [filterType, setFilterType] = useState<'all' | 'unresolved' | 'critical'>('unresolved');

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (filterType === 'unresolved') {
      result = result.filter((a) => !a.resolved);
    } else if (filterType === 'critical') {
      result = result.filter((a) => a.severity === 'critical' && !a.resolved);
    }
    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [alerts, filterType]);

  const getAlertIcon = (type: (typeof alerts)[0]['type']) => {
    switch (type) {
      case 'disease':
        return <AlertCircle className="h-5 w-5" />;
      case 'threshold':
        return <Zap className="h-5 w-5" />;
      case 'predictive':
        return <Clock className="h-5 w-5" />;
      case 'anomaly':
        return <Bell className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: (typeof alerts)[0]['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-health-critical/10 border-health-critical text-health-critical';
      case 'warning':
        return 'bg-health-warning/10 border-health-warning text-health-warning';
      default:
        return 'bg-muted/10 border-muted text-muted-foreground';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Alertas y notificaciones"
        description={`Generadas dinámicamente por AlertEngine · fuente: ${source}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/alerts/settings">
              <Settings className="h-4 w-4" />
              Configurar alertas
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiStat label="Total alertas" value={stats.total} icon={Bell} />
        <KpiStat label="Sin resolver" value={stats.unresolved} icon={AlertCircle} variant="warning" />
        <KpiStat label="Críticas" value={stats.critical} icon={Zap} variant="danger" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'unresolved', 'critical'] as const).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(type)}
            className="gap-2 capitalize"
          >
            {type === 'all' && <Filter className="h-4 w-4" />}
            {type === 'all' ? 'Todas' : type === 'unresolved' ? `Sin resolver (${stats.unresolved})` : `Críticas (${stats.critical})`}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Card
            key={alert.id}
            className={`glass-card border-2 transition-all ${alert.resolved ? 'opacity-70 border-border bg-muted/20' : getSeverityColor(alert.severity)}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge variant="outline" className="capitalize text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Field: {FIELD_NAMES[alert.fieldId] ?? alert.fieldId}</span>
                      <span>Zone: {alert.zoneId}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <span className="font-medium text-primary">Action: </span>
                      {alert.recommendation}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                {!alert.resolved && (
                  <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                    Marcar resuelta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <Card className="glass-card text-center py-12">
          <CardContent>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No hay alertas en este momento</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
