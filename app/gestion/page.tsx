'use client';

import { useState } from 'react';
import { TeamPanel } from '@/components/gestion/team-panel';
import Link from 'next/link';
import { useFields } from '@/hooks/use-fields';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCropLabelEs, getCropColor } from '@/lib/design/tokens';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import type { CropType } from '@/lib/mock-data/crops';
import { FieldDetailSheet } from '@/components/fields/field-detail-sheet';
import { ZoneDetailSheet } from '@/components/fields/zone-detail-sheet';
import type { Field, FieldZone } from '@/lib/types/field';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import { labelHealthPlain } from '@/lib/i18n/plain-labels';
import type { HealthLevel } from '@/lib/design/tokens';

function fieldHealthLevel(field: Field): HealthLevel {
  const avg = field.zones.reduce((s, z) => s + z.ndviAverage, 0) / (field.zones.length || 1);
  if (avg >= 0.65) return 'good';
  if (avg >= 0.45) return 'warning';
  return 'critical';
}

export default function GestionPage() {
  const { plain } = usePlainExperience();
  const { fields, refresh } = useFields();
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [fieldSheetOpen, setFieldSheetOpen] = useState(false);
  const [detailZone, setDetailZone] = useState<FieldZone | null>(null);
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
  const byCrop = fields.reduce<Record<string, typeof fields>>((acc, f) => {
    (acc[f.crop] ??= []).push(f);
    return acc;
  }, {});

  return (
    <PageContainer size="wide">
      <PageHeader
        title={plain ? 'Mis parcelas' : 'Gestión de finca'}
        description={plain ? 'Tus parcelas y cultivos.' : 'Parcelas, cultivos, equipo y comunicaciones.'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-[44px]">
              <Link href="/setup/parcel?from=gestion">Agregar parcela</Link>
            </Button>
            {!plain && (
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/setup/import?from=gestion">Migrar desde QGIS/GIS</Link>
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="parcelas">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          {!plain && <TabsTrigger value="cultivos">Cultivos</TabsTrigger>}
          {!plain && <TabsTrigger value="equipo">Equipo</TabsTrigger>}
          {!plain && <TabsTrigger value="comms">Comunicaciones</TabsTrigger>}
        </TabsList>

        <TabsContent value="parcelas" className="space-y-4 mt-4">
          {fields.map((field) => (
            <Card
              key={field.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => {
                setSelectedField(field);
                setFieldSheetOpen(true);
              }}
            >
              <CardHeader>
                <CardTitle className="text-base">{field.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  {getCropLabelEs(field.crop)} · {field.area} ha
                  {plain
                    ? ` · ${labelHealthPlain(fieldHealthLevel(field))}`
                    : ` · ${field.zones.length} zonas`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedField(field);
                      setFieldSheetOpen(true);
                    }}
                  >
                    Ver detalle
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/monitor?field=${field.id}`}>Monitorear</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!fields.length && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center space-y-4">
                <p className="text-muted-foreground text-sm">
                  Todavía no tenés parcelas registradas.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="min-h-[44px]">
                    <Link href="/setup/parcel?from=gestion">Marcar en el mapa</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link href="/setup/import?from=gestion">Migrar desde QGIS/GIS</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cultivos" className="space-y-4 mt-4">
          {Object.entries(byCrop).map(([crop, list]) => {
            const profile = CROP_PROFILES[crop as CropType];
            const stage = list[0]
              ? profile.growthStages.find(
                  (s) =>
                    list[0].daysFromPlanting >= s.daysFromPlanting[0] &&
                    list[0].daysFromPlanting <= s.daysFromPlanting[1]
                )?.stage
              : null;
            return (
              <Card key={crop}>
                <CardHeader>
                  <CardTitle
                    className="text-base"
                    style={{ color: getCropColor(crop) }}
                  >
                    {getCropLabelEs(crop)} ({list.length} lotes)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {stage && <p>Fenología ref.: {stage}</p>}
                  <Button size="sm" className="mt-2" asChild>
                    <Link href={`/monitor?crop=${crop}`}>Ver en monitor</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <TeamPanel />
        </TabsContent>

        <TabsContent value="comms" className="mt-4">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Configuración detallada en{' '}
              <Link href="/alerts/settings" className="text-primary underline">
                Alertas → Configuración
              </Link>
              . Quiet hours y WhatsApp se guardan vía API de reglas de notificación.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FieldDetailSheet
        field={selectedField}
        open={fieldSheetOpen}
        onOpenChange={(open) => {
          setFieldSheetOpen(open);
          if (!open) setSelectedField(null);
        }}
        onZoneSelect={(zone) => {
          setDetailZone(zone);
          setZoneSheetOpen(true);
        }}
      />
      <ZoneDetailSheet
        zone={detailZone}
        field={selectedField}
        open={zoneSheetOpen}
        onOpenChange={setZoneSheetOpen}
      />
    </PageContainer>
  );
}
