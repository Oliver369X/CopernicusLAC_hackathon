'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFields } from '@/hooks/use-fields';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCropLabelEs, getCropColor } from '@/lib/design/tokens';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import type { CropType } from '@/lib/mock-data/crops';
import { toast } from 'sonner';
import { TeamZoneAssignments } from '@/components/gestion/team-zone-assignments';
import { FieldDetailSheet } from '@/components/fields/field-detail-sheet';
import { ZoneDetailSheet } from '@/components/fields/zone-detail-sheet';
import type { Field, FieldZone } from '@/lib/types/field';

export default function GestionPage() {
  const { fields, refresh } = useFields();
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [fieldSheetOpen, setFieldSheetOpen] = useState(false);
  const [detailZone, setDetailZone] = useState<FieldZone | null>(null);
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  async function inviteMember() {
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = (await res.json()) as { inviteUrl?: string; error?: string };
    if (!res.ok) {
      toast.error(data.error ?? 'No se pudo invitar');
      return;
    }
    if (data.inviteUrl) {
      try {
        await navigator.clipboard.writeText(data.inviteUrl);
        toast.success('Enlace copiado al portapapeles');
      } catch {
        toast.success(`Invitación: ${data.inviteUrl}`);
      }
    } else {
      toast.success('Invitación creada');
    }
    setInviteEmail('');
  }

  const byCrop = fields.reduce<Record<string, typeof fields>>((acc, f) => {
    (acc[f.crop] ??= []).push(f);
    return acc;
  }, {});

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Gestión de finca"
        description="Parcelas, cultivos, equipo y comunicaciones."
        actions={
          <Button asChild variant="outline">
            <Link href="/onboarding">Importar parcelas</Link>
          </Button>
        }
      />

      <Tabs defaultValue="parcelas">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          <TabsTrigger value="cultivos">Cultivos</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="comms">Comunicaciones</TabsTrigger>
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
                  {getCropLabelEs(field.crop)} · {field.area} ha · {field.zones.length} zonas
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
            <p className="text-muted-foreground text-sm">
              Sin parcelas. <Link href="/onboarding" className="text-primary underline">Importar</Link>
            </p>
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

        <TabsContent value="equipo" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invitar miembro</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Input
                placeholder="email@finca.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="max-w-xs"
              />
              <select
                className="rounded-md border bg-background px-3 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
                <option value="field_worker">Campo</option>
              </select>
              <Button onClick={() => void inviteMember()}>Invitar</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zonas por técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamZoneAssignments />
            </CardContent>
          </Card>
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
