'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAlerts } from '@/hooks/use-alerts';
import { useFields } from '@/hooks/use-fields';
import { getFieldNameMap, getZoneById } from '@/lib/mock-data/fields';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { KpiStat } from '@/components/layout/kpi-stat';
import { AlertListCard } from '@/components/alerts/alert-list-card';
import { HoverLift, StaggerList } from '@/components/ui/motion';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Zap,
  Filter,
  Settings,
} from 'lucide-react';
import { formatDataSourceLabel } from '@/lib/i18n/data-source';

const FIELD_NAMES = getFieldNameMap();

function zoneLabel(fieldId: string, zoneId: string): string {
  const zone = getZoneById(zoneId);
  if (zone?.name) return zone.name;
  const short = zoneId.replace(/^zone-/i, 'Zona ');
  return short.length > 24 ? `${short.slice(0, 22)}…` : short;
}

export default function AlertsPage() {
  const { alerts, stats, resolveAlert, source } = useAlerts();
  const { fields } = useFields();
  const [filterType, setFilterType] = useState<'all' | 'unresolved' | 'critical'>(
    'unresolved'
  );

  const fieldNameMap = useMemo(() => {
    const map = { ...FIELD_NAMES };
    fields.forEach((f) => {
      map[f.id] = f.name;
    });
    return map;
  }, [fields]);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (filterType === 'unresolved') {
      result = result.filter((a) => !a.resolved);
    } else if (filterType === 'critical') {
      result = result.filter((a) => a.severity === 'critical' && !a.resolved);
    }
    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [alerts, filterType]);

  return (
    <PageContainer size="wide">
      <PageHeader
        description={`Motor de alertas multisensor · Fuente: ${formatDataSourceLabel(source)}`}
        actions={
          <Button variant="outline" size="sm" className="h-10 gap-2" asChild>
            <Link href="/alerts/settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurar</span>
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <KpiStat label="Total" value={stats.total} icon={Bell} className="min-w-0" />
        <KpiStat
          label="Sin resolver"
          value={stats.unresolved}
          icon={AlertCircle}
          variant="warning"
        />
        <KpiStat
          label="Críticas"
          value={stats.critical}
          icon={Zap}
          variant="danger"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
        {(['all', 'unresolved', 'critical'] as const).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            size="sm"
            className="h-10 shrink-0 gap-2 px-4 text-sm"
            onClick={() => setFilterType(type)}
          >
            {type === 'all' && <Filter className="h-4 w-4" />}
            {type === 'all'
              ? 'Todas'
              : type === 'unresolved'
                ? `Sin resolver (${stats.unresolved})`
                : `Críticas (${stats.critical})`}
          </Button>
        ))}
      </div>

      <StaggerList className="space-y-3">
        {filteredAlerts.map((alert) => (
          <li key={`${alert.id}-${alert.zoneId}`}>
            <HoverLift>
              <AlertListCard
                alert={alert}
                fieldLabel={fieldNameMap[alert.fieldId] ?? alert.fieldId}
                zoneLabel={zoneLabel(alert.fieldId, alert.zoneId)}
                onResolve={resolveAlert}
              />
            </HoverLift>
          </li>
        ))}
      </StaggerList>

      {filteredAlerts.length === 0 && (
        <Card className="glass-card py-14 text-center">
          <CardContent className="space-y-3">
            <CheckCircle2 className="mx-auto h-14 w-14 text-health-excellent opacity-70" />
            <p className="text-base font-medium text-foreground">
              No hay alertas en este filtro
            </p>
            <p className="text-sm text-muted-foreground">
              Probá «Todas» o revisá la configuración de umbrales.
            </p>
            <Button variant="outline" size="sm" className="h-10" asChild>
              <Link href="/alerts/settings">Ir a configuración</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
