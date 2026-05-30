'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getDaysToMaturityForField } from '@/lib/mock-data/fields';
import { useFields } from '@/hooks/use-fields';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import type { SatelliteData } from '@/lib/mock-data/satellite-data';
import {
  buildSatelliteDataFromMetrics,
  buildTrendFromHistory,
  metricsFromZone,
  type MetricsHistoryPoint,
} from '@/lib/data/satellite-from-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Eye, TrendingUp, Loader2, FlaskConical } from 'lucide-react';
import { isScienceCrop } from '@/lib/science/crops/registry';
import FieldMap from '@/components/dashboard/field-map';
import SatelliteMapPanel from '@/components/monitor/satellite-map-panel';
import HealthMetrics from '@/components/dashboard/health-metrics';
import ZoneGrid from '@/components/dashboard/zone-grid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function MonitorContent() {
  const searchParams = useSearchParams();
  const initialFieldId = searchParams.get('field') || 'field-1';
  const { fields, loading, source, getFieldById } = useFields();

  const [selectedFieldId, setSelectedFieldId] = useState(initialFieldId);
  const selectedField = getFieldById(selectedFieldId) ?? fields[0];
  const [selectedZone, setSelectedZone] = useState(selectedField?.zones[0] ?? null);
  const [satelliteData, setSatelliteData] = useState<SatelliteData | null>(null);
  const [trendData, setTrendData] = useState<
    Array<{ date: string; ndvi: string; ndmi: string }>
  >([]);
  const [missions, setMissions] = useState<string[]>([]);
  const [satelliteSource, setSatelliteSource] = useState<string>('mock');
  const [metricsSource, setMetricsSource] = useState<'mock' | 'database'>('mock');
  const [scienceScore, setScienceScore] = useState<number | null>(null);
  const [scienceHealth, setScienceHealth] = useState<string | null>(null);

  useEffect(() => {
    if (selectedField && !selectedField.zones.find((z) => z.id === selectedZone?.id)) {
      setSelectedZone(selectedField.zones[0] ?? null);
    }
  }, [selectedField, selectedZone?.id]);

  useEffect(() => {
    if (!selectedField) return;

    const zone = selectedZone ?? selectedField.zones[0];
    if (!zone) return;

    const fallback = metricsFromZone(zone);

    const zoneParam = zone.id ? `?zoneId=${encodeURIComponent(zone.id)}` : '';
    fetch(`/api/fields/${selectedField.id}/metrics${zoneParam}`)
      .then((r) => r.json())
      .then((data) => {
        const metrics = data.metrics ?? fallback;
        setSatelliteData(
          buildSatelliteDataFromMetrics(
            selectedField.id,
            metrics,
            30,
            data.ndviGrid ?? null
          )
        );
        setMetricsSource(data.source === 'database' ? 'database' : 'mock');
        setSatelliteSource(data.satelliteSource ?? 'mock');
        setMissions(data.missions ?? []);
        setTrendData(
          buildTrendFromHistory(
            (data.satelliteHistory ?? []) as MetricsHistoryPoint[],
            metrics.ndvi,
            metrics.ndmi
          )
        );
      })
      .catch(() => {
        setSatelliteData(buildSatelliteDataFromMetrics(selectedField.id, fallback));
        setTrendData(buildTrendFromHistory([], fallback.ndvi, fallback.ndmi));
      });
  }, [selectedField, selectedZone]);

  useEffect(() => {
    if (!selectedField || !isScienceCrop(selectedField.crop)) {
      setScienceScore(null);
      setScienceHealth(null);
      return;
    }
    const zone = selectedZone ?? selectedField.zones[0];
    if (!zone) return;
    fetch(
      `/api/science/${selectedField.crop}/analysis?fieldId=${selectedField.id}&zoneId=${zone.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.fusionScore === 'number') {
          setScienceScore(data.fusionScore);
          setScienceHealth(data.healthLabel ?? null);
        }
      })
      .catch(() => {
        setScienceScore(null);
        setScienceHealth(null);
      });
  }, [selectedField, selectedZone]);

  const cropProfile = useMemo(
    () => (selectedField ? CROP_PROFILES[selectedField.crop] : null),
    [selectedField]
  );

  const growthStage = useMemo(() => {
    if (!selectedField) return 'Unknown';
    const daysToMaturity = getDaysToMaturityForField(selectedField);
    if (daysToMaturity > 60) return 'Early Vegetative';
    if (daysToMaturity > 40) return 'Vegetative';
    if (daysToMaturity > 20) return 'Flowering';
    return 'Grain Fill';
  }, [selectedField]);

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    const field = getFieldById(fieldId);
    if (field) setSelectedZone(field.zones[0] ?? null);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Cargando campos...
        </div>
      </PageContainer>
    );
  }

  if (!selectedField || !satelliteData) {
    return (
      <PageContainer>
        <div className="py-24 text-center text-muted-foreground">No hay campos disponibles</div>
      </PageContainer>
    );
  }

  const activeAlerts = selectedField.notifications;

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Monitoreo satelital"
        description="Copernicus Sentinel-1/2/3 + heatmap NDVI real por zona"
        badge={
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs capitalize">
              {source} / {metricsSource} / {satelliteSource}
            </Badge>
            {missions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {missions.join(' · ')}
              </Badge>
            )}
            {isScienceCrop(selectedField.crop) && scienceScore != null && (
              <Badge variant="outline" className="text-xs gap-1" asChild>
                <Link href={`/science/${selectedField.crop}?field=${selectedField.id}`}>
                  <FlaskConical className="h-3 w-3" />
                  Science {(scienceScore * 100).toFixed(0)}%
                  {scienceHealth ? ` · ${scienceHealth}` : ''}
                </Link>
              </Badge>
            )}
          </div>
        }
        actions={
          <Select value={selectedField.id} onValueChange={handleFieldChange}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Seleccionar campo" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name} · {field.crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {activeAlerts > 0 && (
        <Card className="border-health-critical/30 bg-health-critical/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-health-critical" />
              <p className="font-semibold">{activeAlerts} active alert(s)</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/alerts">View Alerts</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Mapa Satelital (Copernicus S2)</CardTitle>
            </CardHeader>
            <CardContent>
              <SatelliteMapPanel field={selectedField} />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                NDVI Heat Map
                {satelliteData.isRealGrid && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Grilla Copernicus S2
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldMap field={selectedField} satelliteData={satelliteData} />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">NDVI & NDMI Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ndvi" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="ndmi" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Field Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <ZoneGrid
                zones={selectedField.zones}
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{selectedField.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crop</span>
                <span>{cropProfile?.name ?? selectedField.crop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area</span>
                <span>{selectedField.area} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days to Harvest</span>
                <span>{getDaysToMaturityForField(selectedField)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Growth Stage</span>
                <span className="text-primary">{growthStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Score</span>
                <span>{selectedField.riskScore}/100</span>
              </div>
            </CardContent>
          </Card>

          {selectedZone && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{selectedZone.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>NDVI</span>
                  <span>{selectedZone.ndviAverage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Moisture</span>
                  <span>{selectedZone.soilMoistureAverage.toFixed(0)}%</span>
                </div>
                <Button className="w-full mt-2 gap-2" size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                  Zone Details
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-mono text-xs">{selectedField.center.lat.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alerts</span>
                <span className="font-bold text-health-critical">{activeAlerts}</span>
              </div>
            </CardContent>
          </Card>

          <HealthMetrics satelliteData={satelliteData} trendHistory={trendData} />
        </div>
      </div>
    </PageContainer>
  );
}

export default function MonitorClient() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <MonitorContent />
    </Suspense>
  );
}
