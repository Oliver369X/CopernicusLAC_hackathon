'use client';

import { useMemo } from 'react';
import { useFields } from '@/hooks/use-fields';
import { useAnalyticsSummary } from '@/hooks/use-analytics-summary';
import { useAlerts } from '@/hooks/use-alerts';
import { Briefcase, AlertTriangle, TrendingUp, BarChart3, Bell, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { KpiStat } from '@/components/layout/kpi-stat';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Link from 'next/link';

const trendData = [
  { date: 'Mon', health: 72, risk: 42 },
  { date: 'Tue', health: 74, risk: 40 },
  { date: 'Wed', health: 71, risk: 45 },
  { date: 'Thu', health: 75, risk: 38 },
  { date: 'Fri', health: 76, risk: 36 },
  { date: 'Sat', health: 78, risk: 32 },
  { date: 'Sun', health: 75, risk: 40 },
];

const DEFAULT_CROP_DATA = [
  { name: 'Soybean', value: 35, fill: '#3b82f6' },
  { name: 'Corn', value: 28, fill: '#10b981' },
  { name: 'Wheat', value: 18, fill: '#f59e0b' },
  { name: 'Cotton', value: 12, fill: '#8b5cf6' },
  { name: 'Canola', value: 7, fill: '#ef4444' },
];

const DEFAULT_HEALTH_DATA = [
  { name: 'Excellent', value: 15, fill: '#10b981' },
  { name: 'Good', value: 20, fill: '#84cc16' },
  { name: 'Warning', value: 12, fill: '#f59e0b' },
  { name: 'Critical', value: 5, fill: '#ef4444' },
];

export default function EnhancedDashboard() {
  const { fields, source: fieldsSource } = useFields();
  const { alerts: engineAlerts, stats: alertStats } = useAlerts();
  const { summary } = useAnalyticsSummary();

  const healthChartData = useMemo(() => {
    const dist = summary?.healthDistribution;
    if (!dist) return DEFAULT_HEALTH_DATA;
    return [
      { name: 'Excellent', value: dist.excellent ?? 0, fill: '#10b981' },
      { name: 'Good', value: dist.good ?? 0, fill: '#84cc16' },
      { name: 'Warning', value: dist.warning ?? 0, fill: '#f59e0b' },
      { name: 'Critical', value: dist.critical ?? 0, fill: '#ef4444' },
    ];
  }, [summary]);

  const cropChartData = useMemo(() => {
    if (!summary?.fields?.length) return DEFAULT_CROP_DATA;
    const counts: Record<string, number> = {};
    summary.fields.forEach((f) => {
      counts[f.crop] = (counts[f.crop] ?? 0) + 1;
    });
    const colors: Record<string, string> = {
      soybean: '#3b82f6',
      corn: '#10b981',
      wheat: '#f59e0b',
      cotton: '#8b5cf6',
    };
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: colors[name] ?? '#64748b',
    }));
  }, [summary]);

  const activeAlerts = useMemo(
    () =>
      engineAlerts
        .filter((a) => !a.resolved)
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          active: true,
          severity: a.severity,
          title: a.title,
          description: a.fieldId,
        })),
    [engineAlerts]
  );

  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

  const healthScoreMap = { excellent: 95, good: 80, warning: 60, critical: 35 };
  const totalArea = fields.reduce((sum, f) => sum + f.area, 0);
  const avgHealth = Math.round(
    fields.reduce((sum, f) => sum + healthScoreMap[f.overallHealth], 0) / fields.length
  );
  const avgRisk = Math.round(fields.reduce((sum, f) => sum + f.riskScore, 0) / fields.length);
  const atRiskCount = fields.filter((f) => f.riskScore > 50).length;

  return (
    <PageContainer>
      <PageHeader
        title="Panel de control"
        description="Vista general de salud, riesgo y alertas de tus campos monitoreados."
        badge={
          <Badge variant="outline" className="capitalize text-xs">
            {fieldsSource} · {fields.length} campos
          </Badge>
        }
        actions={
          <Link href="/alerts">
            <Button className="gap-2">
              <Bell className="h-4 w-4" />
              Ver alertas
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiStat label="Campos" value={fields.length} hint="Monitoreados" icon={Briefcase} />
        <KpiStat label="Área total" value={totalArea} hint="hectáreas" icon={BarChart3} variant="success" />
        <KpiStat label="Salud promedio" value={`${avgHealth}%`} hint="Índice compuesto" icon={Activity} variant="success" />
        <KpiStat label="Riesgo promedio" value={avgRisk} hint="puntuación /100" icon={TrendingUp} variant="warning" />
        <KpiStat
          label="Alertas activas"
          value={activeAlerts.length}
          hint={criticalAlerts.length > 0 ? `${criticalAlerts.length} críticas` : 'Estable'}
          icon={AlertTriangle}
          variant={activeAlerts.length > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tendencia 7 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="health" stroke="#10b981" fillOpacity={1} fill="url(#colorHealth)" />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crop Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Distribución de cultivos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cropChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value}) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cropChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Salud por campo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={healthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #334155' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {healthChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Distribución de riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Low Risk (0-30)', count: 15, color: '#10b981' },
                { label: 'Medium Risk (30-60)', count: 18, color: '#f59e0b' },
                { label: 'High Risk (60-85)', count: 8, color: '#ef4444' },
                { label: 'Critical (85+)', count: 2, color: '#8b0000' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(item.count / 43) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
