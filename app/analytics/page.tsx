'use client';

import { useMemo, useState } from 'react';
import { MOCK_FIELDS, getHighRiskFields, getAverageHealth, getAverageRiskScore, getTotalArea } from '@/lib/mock-data/fields';
import { useAnalyticsSummary } from '@/hooks/use-analytics-summary';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { AlertCircle, TrendingDown, TrendingUp, BarChart3, PieChart, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  excellent: '#22c55e',
  good: '#84cc16',
  warning: '#f59e0b',
  critical: '#ef4444',
  soybean: '#8b5cf6',
  corn: '#f97316',
  wheat: '#d97706',
  cotton: '#06b6d4',
  sunflower: '#eab308',
  canola: '#ec4899',
  barley: '#a16207',
  rice: '#059669',
};

export default function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'season'>('month');
  const { summary } = useAnalyticsSummary();

  // Field Health Distribution
  const healthDistribution = useMemo(() => {
    const data = summary?.healthDistribution ?? {
      excellent: MOCK_FIELDS.filter((f) => f.overallHealth === 'excellent').length,
      good: MOCK_FIELDS.filter((f) => f.overallHealth === 'good').length,
      warning: MOCK_FIELDS.filter((f) => f.overallHealth === 'warning').length,
      critical: MOCK_FIELDS.filter((f) => f.overallHealth === 'critical').length,
    };
    return Object.entries(data).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [summary]);

  // Crop Distribution
  const cropDistribution = useMemo(() => {
    const cropCount: Record<string, number> = {};
    MOCK_FIELDS.forEach((field) => {
      const cropName = CROP_PROFILES[field.crop].name;
      cropCount[cropName] = (cropCount[cropName] || 0) + 1;
    });
    return Object.entries(cropCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, []);

  // Risk Timeline
  const riskTimeline = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return days.map((date) => ({
      date: date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
      risk: Math.floor(Math.random() * 30 + getAverageRiskScore() - 10),
      fields: Math.floor(Math.random() * 2 + 4),
    }));
  }, []);

  // Field Comparison Data
  const fieldComparison = useMemo(() => {
    return MOCK_FIELDS.map((field) => ({
      name: field.name.substring(0, 12),
      health: { excellent: 4, good: 3, warning: 2, critical: 1 }[field.overallHealth] * 25,
      risk: 100 - field.riskScore,
      ndvi: field.zones.reduce((sum, z) => sum + z.ndviAverage, 0) / field.zones.length,
      moisture: field.zones.reduce((sum, z) => sum + z.soilMoistureAverage, 0) / field.zones.length,
    }));
  }, []);

  // Economic Analysis Data (mock)
  const economicData = useMemo(() => {
    return MOCK_FIELDS.map((field) => {
      const daysToMaturity = CROP_PROFILES[field.crop].cycleLength - field.daysFromPlanting;
      const estimatedYield = field.overallHealth === 'excellent' ? 5500 : field.overallHealth === 'good' ? 4800 : 3500;
      const investmentPerHa = 800;
      const totalInvestment = field.area * investmentPerHa;
      const pricePerUnit = field.crop === 'wheat' ? 250 : field.crop === 'corn' ? 220 : 420;
      const projectedRevenue = (estimatedYield / 1000) * field.area * pricePerUnit;
      const roi = ((projectedRevenue - totalInvestment) / totalInvestment) * 100;

      return {
        field: field.name.substring(0, 12),
        investment: totalInvestment / 1000,
        projectedRevenue: projectedRevenue / 1000,
        roi: roi,
        daysToMaturity,
      };
    });
  }, []);

  const highRiskFields = useMemo(() => getHighRiskFields(), []);
  const averageHealth = useMemo(() => getAverageHealth(), []);
  const totalArea = useMemo(() => getTotalArea(), []);
  const averageRisk = useMemo(() => getAverageRiskScore(), []);

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Analítica y reportes"
        description="Distribución de salud, cultivos, tendencias de riesgo y proyecciones económicas por campo."
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(['week', 'month', 'season'] as const).map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
            className="capitalize"
          >
            {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Temporada'}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Total Area</p>
              <p className="text-3xl font-bold text-foreground">{totalArea}</p>
              <p className="text-xs text-muted-foreground">hectares</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Average Health</p>
              <p className="text-3xl font-bold text-health-good">{averageHealth.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">overall portfolio</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Average Risk</p>
              <p className="text-3xl font-bold text-health-warning">{averageRisk.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">At Risk</p>
              <p className="text-3xl font-bold text-health-critical">{highRiskFields.length}</p>
              <p className="text-xs text-muted-foreground">fields need attention</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Fields Alert */}
      {highRiskFields.length > 0 && (
        <Card className="border-health-critical/30 bg-health-critical/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-health-critical" />
              High Risk Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highRiskFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{field.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Risk Score: {field.riskScore} • Crop: {CROP_PROFILES[field.crop].name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Health Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Field Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={healthDistribution}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {healthDistribution.map((entry, index) => {
                    const colorMap = {
                      Excellent: COLORS.excellent,
                      Good: COLORS.good,
                      Warning: COLORS.warning,
                      Critical: COLORS.critical,
                    };
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colorMap[entry.name as keyof typeof colorMap] || '#888'}
                      />
                    );
                  })}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crop Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crop Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={cropDistribution}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {cropDistribution.map((entry, index) => {
                    const colorMap: Record<string, string> = COLORS;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colorMap[entry.name.toLowerCase()] || '#888'}
                      />
                    );
                  })}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Risk Trend ({selectedTimeRange})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="risk" stroke={COLORS.warning} name="Average Risk Score" />
                <Line type="monotone" dataKey="fields" stroke={COLORS.critical} name="Fields at Risk" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Field Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Field Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fieldComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="health" fill={COLORS.good} name="Health Score" />
                <Bar dataKey="risk" fill={COLORS.warning} name="Overall Safety" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Economic Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Economic ROI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={economicData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="field" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" label={{ value: 'USD (1000s)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'ROI %', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="investment" fill="#9333ea" name="Investment" />
                <Bar yAxisId="left" dataKey="projectedRevenue" fill={COLORS.good} name="Projected Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#f97316" name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Harvest Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Days to Maturity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {economicData.map((field, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm text-foreground">{field.field}</span>
                  <span className="text-2xl font-bold text-primary">{field.daysToMaturity}</span>
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Fields</span>
              <span className="font-semibold text-foreground">{MOCK_FIELDS.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Area</span>
              <span className="font-semibold text-foreground">{totalArea} ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. NDVI</span>
              <span className="font-semibold text-foreground">
                {(
                  MOCK_FIELDS.reduce((sum, f) => sum + f.zones.reduce((s, z) => s + z.ndviAverage, 0) / f.zones.length, 0) /
                  MOCK_FIELDS.length
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Alerts</span>
              <span className="font-semibold text-health-critical">
                {MOCK_FIELDS.reduce((sum, f) => sum + f.notifications, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Report (PDF)
        </Button>
      </div>
    </PageContainer>
  );
}
