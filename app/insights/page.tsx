'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { useAnalyticsSummary } from '@/hooks/use-analytics-summary';
import { getCropProfile } from '@/lib/mock-data/crops';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { TrendingUp, AlertTriangle, Leaf, Droplets, Thermometer, BarChart3 } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Insights() {
  const { summary } = useAnalyticsSummary();

  // Correlation Analysis: NDVI vs Yield Potential
  const correlationData = useMemo(() => {
    const fields = summary?.fields?.length
      ? summary.fields.map((f) => ({
          name: f.name,
          ndvi: f.ndvi,
          ndre: f.ndre,
          riskScore: f.riskScore,
        }))
      : MOCK_FIELDS.map((field) => {
          const avgNdvi = field.zones.reduce((sum, z) => sum + z.ndviAverage, 0) / field.zones.length;
          return { name: field.name, ndvi: avgNdvi, ndre: null as number | null, riskScore: field.riskScore };
        });

    return fields.map((field) => {
      const avgNdvi = field.ndvi;
      const avgMoisture = 65;
      const yieldPotential = avgNdvi * 100 * (avgMoisture / 100) * 35 + 1500;

      return {
        field: field.name,
        ndvi: avgNdvi,
        moisture: avgMoisture,
        yieldPotential: Math.round(yieldPotential),
        riskScore: field.riskScore,
      };
    });
  }, [summary]);

  // Disease Risk Matrix
  const diseaseRisks = useMemo(() => {
    const risks: { [key: string]: number } = {};

    MOCK_FIELDS.forEach((field) => {
      field.zones.forEach((zone) => {
        zone.diseaseRisks.forEach((disease) => {
          risks[disease] = (risks[disease] || 0) + 1;
        });
      });
    });

    return Object.entries(risks)
      .map(([disease, count]) => ({
        disease,
        fieldCount: count,
        prevalence: (count / MOCK_FIELDS.length) * 100,
      }))
      .sort((a, b) => b.fieldCount - a.fieldCount);
  }, []);

  // Crop Performance Comparison
  const cropPerformance = useMemo(() => {
    const crops: { [key: string]: { fields: number; avgHealth: number; avgRisk: number } } = {};

    MOCK_FIELDS.forEach((field) => {
      const cropName = getCropProfile(field.crop).name;
      if (!crops[cropName]) {
        crops[cropName] = { fields: 0, avgHealth: 0, avgRisk: 0 };
      }
      const healthScore = { excellent: 4, good: 3, warning: 2, critical: 1 }[field.overallHealth];
      crops[cropName].fields += 1;
      crops[cropName].avgHealth += healthScore * 25;
      crops[cropName].avgRisk += field.riskScore;
    });

    return Object.entries(crops).map(([crop, data]) => ({
      crop,
      fields: data.fields,
      avgHealth: Math.round(data.avgHealth / data.fields),
      avgRisk: Math.round(data.avgRisk / data.fields),
    }));
  }, []);

  // Environmental Conditions Analysis
  const envAnalysis = useMemo(() => {
    const conditions = {
      optimal: 0,
      suboptimal: 0,
      stress: 0,
      critical: 0,
    };

    MOCK_FIELDS.forEach((field) => {
      field.zones.forEach((zone) => {
        const moistureRatio = zone.soilMoistureAverage / 70; // Assuming 70% is optimal
        const tempGood = zone.temperatureAverage > 15 && zone.temperatureAverage < 30;

        if (zone.ndviAverage > 0.6 && moistureRatio > 0.8 && tempGood) {
          conditions.optimal += 1;
        } else if (zone.ndviAverage > 0.5 && moistureRatio > 0.6) {
          conditions.suboptimal += 1;
        } else if (zone.ndviAverage > 0.35 || moistureRatio < 0.5) {
          conditions.stress += 1;
        } else {
          conditions.critical += 1;
        }
      });
    });

    const total = Object.values(conditions).reduce((a, b) => a + b, 0);
    return [
      { status: 'Optimal', zones: conditions.optimal, pct: ((conditions.optimal / total) * 100).toFixed(0) },
      { status: 'Suboptimal', zones: conditions.suboptimal, pct: ((conditions.suboptimal / total) * 100).toFixed(0) },
      { status: 'Stress', zones: conditions.stress, pct: ((conditions.stress / total) * 100).toFixed(0) },
      { status: 'Critical', zones: conditions.critical, pct: ((conditions.critical / total) * 100).toFixed(0) },
    ];
  }, []);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = [];

    // Check for water stress
    const highMoistureStress = MOCK_FIELDS.filter((f) =>
      f.zones.some((z) => z.soilMoistureAverage < 60)
    ).length;
    if (highMoistureStress > 0) {
      recs.push({
        id: 'water',
        title: 'Water Management Alert',
        description: `${highMoistureStress} field(s) showing water stress. Consider irrigation scheduling.`,
        priority: 'high',
        icon: Droplets,
      });
    }

    // Check for disease risks
    if (diseaseRisks.length > 0) {
      recs.push({
        id: 'disease',
        title: 'Disease Risk Management',
        description: `${diseaseRisks[0].disease} detected in ${diseaseRisks[0].fieldCount} field(s). Apply preventive measures.`,
        priority: 'high',
        icon: AlertTriangle,
      });
    }

    // Growth stage optimization
    recs.push({
      id: 'growth',
      title: 'Growth Stage Optimization',
      description: 'Adjust fertilizer programs based on current growth stages across fields.',
      priority: 'medium',
      icon: Leaf,
    });

    // Temperature monitoring
    const highTemp = MOCK_FIELDS.filter((f) =>
      f.zones.some((z) => z.temperatureAverage > 32)
    ).length;
    if (highTemp > 0) {
      recs.push({
        id: 'temp',
        title: 'Heat Stress Management',
        description: `${highTemp} field(s) experiencing high temperatures. Monitor for heat stress.`,
        priority: 'medium',
        icon: Thermometer,
      });
    }

    return recs;
  }, [diseaseRisks]);

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Perspectivas avanzadas"
        description="Análisis profundo y recomendaciones accionables basadas en datos satelitales y de campo."
      />

      {summary?.climateViability && summary.climateViability.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Riesgo climático 2030 (C3S / ERA5-Land)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.climateViability.map((c) => {
              const field = summary.fields.find((f) => f.id === c.fieldId);
              const score = c.viabilityScore ?? 0;
              const pct = Math.round(score * 100);
              return (
                <div key={c.fieldId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{field?.name ?? c.fieldId}</span>
                    <Badge variant={pct < 45 ? 'destructive' : 'secondary'}>
                      Viabilidad {pct}% · {c.projectionYear ?? 2030}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Science Lab indices */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Índices avanzados por cultivo (Science Lab)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="text-muted-foreground">
            NDRE, DpRVI, REDSI (trigo), texturas SAR (café/cacao) y fusión reglas + ML en{' '}
            <Link href="/science" className="text-primary underline">/science</Link>.
          </p>
          <div className="flex flex-wrap gap-2">
            {(['soybean', 'wheat', 'corn', 'coffee', 'cacao'] as const).map((c) => (
              <Link key={c} href={`/science/${c}`}>
                <Badge variant="outline" className="capitalize cursor-pointer hover:bg-muted">
                  {c}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Recommended Actions</h3>
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            const isHigh = rec.priority === 'high';
            return (
              <Card
                key={rec.id}
                className={`border-l-4 ${isHigh ? 'border-l-health-critical bg-health-critical/5' : 'border-l-health-warning bg-health-warning/5'}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isHigh ? 'text-health-critical' : 'text-health-warning'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{rec.title}</h3>
                        <Badge variant={isHigh ? 'destructive' : 'secondary'}>{rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NDVI vs Yield Potential */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              NDVI vs Yield Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ndvi" type="number" name="NDVI" />
                <YAxis dataKey="yieldPotential" type="number" name="Yield Potential (kg/ha)" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter
                  name="Fields"
                  data={correlationData}
                  fill="#8884d8"
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Environmental Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zone Environmental Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {envAnalysis.map((item) => {
                const colors = {
                  'Optimal': 'bg-health-excellent',
                  'Suboptimal': 'bg-health-good',
                  'Stress': 'bg-health-warning',
                  'Critical': 'bg-health-critical',
                };
                return (
                  <div key={item.status}>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-muted-foreground">{item.status}</span>
                      <span className="font-semibold text-foreground">{item.zones} zones ({item.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${colors[item.status as keyof typeof colors]}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Crop Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Crop Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cropPerformance.map((crop) => (
                <div key={crop.crop} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-foreground">{crop.crop}</span>
                    <span className="text-xs text-muted-foreground">{crop.fields} field(s)</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Health</span>
                      <span className="text-foreground font-medium">{crop.avgHealth}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-health-good"
                        style={{ width: `${crop.avgHealth}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Risk</span>
                      <span className="text-foreground font-medium">{crop.avgRisk}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-health-warning"
                        style={{ width: `${Math.min(crop.avgRisk, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disease Risk Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disease Risk Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diseaseRisks.slice(0, 6).map((risk) => (
                <div key={risk.disease} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground truncate">{risk.disease}</span>
                    <span className="text-xs font-semibold text-health-critical">
                      {risk.fieldCount} field{risk.fieldCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-health-critical"
                      style={{ width: `${Math.min(risk.prevalence, 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              {diseaseRisks.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No disease risks detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Field Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">NDVI</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Moisture</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Yield Potential</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-3 text-foreground font-medium">{row.field}</td>
                    <td className="text-center py-2 px-3">
                      <span className="text-health-good font-semibold">{row.ndvi.toFixed(2)}</span>
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className="text-foreground">{row.moisture.toFixed(0)}%</span>
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className="text-health-excellent font-semibold">{row.yieldPotential}</span>
                      <span className="text-xs text-muted-foreground ml-1">kg/ha</span>
                    </td>
                    <td className="text-center py-2 px-3">
                      <Badge
                        variant={row.riskScore > 50 ? 'destructive' : 'secondary'}
                        className="justify-center"
                      >
                        {row.riskScore}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
