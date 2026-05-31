'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone, Phone, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { AlertChannelRow } from '@/components/alerts/alert-channel-row';
import { toast } from 'sonner';
import { useFields } from '@/hooks/use-fields';
import { getCropLabelEs } from '@/lib/design/tokens';
import { labelAlertType, labelAlertSeverity } from '@/lib/i18n/labels';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

type AlertTypeKey = 'disease' | 'threshold' | 'predictive' | 'anomaly';

interface TypeConfig {
  enabled: boolean;
  severity: string;
}

interface ChannelState {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: ReactNode;
}

const DEFAULT_CHANNELS: Omit<ChannelState, 'icon'>[] = [
  { id: 'in-app', name: 'Notificaciones en la app', description: 'Alertas dentro de Doctor Soya', enabled: true },
  { id: 'email', name: 'Correo electrónico', description: 'Recibir alertas por correo', enabled: true },
  { id: 'sms', name: 'SMS', description: 'Alertas críticas por mensaje de texto', enabled: false },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Alertas críticas con mapa vía Twilio', enabled: false },
  { id: 'push', name: 'Notificaciones push', description: 'Escritorio y móvil (PWA)', enabled: true },
];

const DEFAULT_ALERT_TYPES: Record<AlertTypeKey, TypeConfig> = {
  disease: { enabled: true, severity: 'critical' },
  threshold: { enabled: true, severity: 'warning' },
  predictive: { enabled: true, severity: 'warning' },
  anomaly: { enabled: true, severity: 'info' },
};

function channelsWithIcons(list: Omit<ChannelState, 'icon'>[]): ChannelState[] {
  return list.map((c) => ({ ...c, icon: CHANNEL_ICONS[c.id] ?? <Bell className="h-5 w-5" /> }));
}

const CHANNEL_ICONS: Record<string, ReactNode> = {
  'in-app': <Bell className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  sms: <Smartphone className="h-5 w-5" />,
  whatsapp: <Phone className="h-5 w-5" />,
  push: <MessageSquare className="h-5 w-5" />,
};

export default function AlertSettingsPage() {
  const { fields } = useFields();
  const [channels, setChannels] = useState<ChannelState[]>(() =>
    channelsWithIcons(DEFAULT_CHANNELS)
  );
  const [alertTypes, setAlertTypes] = useState(DEFAULT_ALERT_TYPES);
  const [phone, setPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts/settings');
      const { data } = await parseJsonResponse<{
        config?: Record<string, TypeConfig>;
        profile?: { phone?: string; whatsapp_opt_in?: boolean };
      }>(res, { config: DEFAULT_ALERT_TYPES, profile: {} });

      if (data?.config) {
        const types = ['disease', 'threshold', 'predictive', 'anomaly'] as const;
        setAlertTypes((prev) => {
          const next = { ...prev };
          types.forEach((t) => {
            if (data.config?.[t]) {
              next[t] = {
                enabled: data.config[t].enabled ?? true,
                severity: data.config[t].severity ?? prev[t].severity,
              };
            }
          });
          return next;
        });
      }
      if (data?.profile) {
        setPhone(data.profile.phone ?? '');
        setWhatsappOptIn(Boolean(data.profile.whatsapp_opt_in));
        if (data.profile.whatsapp_opt_in) {
          setChannels((prev) =>
            prev.map((c) => (c.id === 'whatsapp' ? { ...c, enabled: true } : c))
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleChannel = (id: string, enabled: boolean) => {
    setChannels((prev) => prev.map((ch) => (ch.id === id ? { ...ch, enabled } : ch)));
  };

  const toggleAlertType = (type: AlertTypeKey) => {
    setAlertTypes((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled },
    }));
  };

  const setTypeSeverity = (type: AlertTypeKey, severity: string) => {
    setAlertTypes((prev) => ({
      ...prev,
      [type]: { ...prev[type], severity },
    }));
  };

  const handleReset = () => {
    setChannels(channelsWithIcons(DEFAULT_CHANNELS));
    setAlertTypes(DEFAULT_ALERT_TYPES);
    setPhone('');
    setWhatsappOptIn(false);
    toast.message('Valores restaurados (guardá para aplicar)');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = Object.fromEntries(
        Object.entries(alertTypes).map(([key, val]) => [
          key,
          {
            enabled: val.enabled,
            severity: val.severity,
            channels: channels.filter((c) => c.enabled).map((c) => c.id),
            cooldown: 60,
          },
        ])
      );

      const res = await fetch('/api/alerts/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!res.ok) {
        const { data, error } = await parseJsonResponse<{ error?: string }>(res);
        toast.error(data?.error ?? error ?? 'Error al guardar');
        return;
      }

      await fetch('/api/alerts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || undefined,
          whatsappOptIn:
            channels.find((c) => c.id === 'whatsapp')?.enabled ?? whatsappOptIn,
        }),
      });

      toast.success('Configuración guardada');

      if (channels.find((c) => c.id === 'push')?.enabled && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        description="Canales, tipos de alerta y preferencias de notificación."
        actions={
          <Button variant="outline" size="sm" className="h-10 gap-2" asChild>
            <Link href="/alerts">
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <Card className="glass-card min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Canales de notificación</CardTitle>
          <p className="text-sm text-muted-foreground">
            Elegí cómo recibir cada alerta según su severidad
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {channels.map((channel) => (
            <AlertChannelRow
              key={channel.id}
              icon={channel.icon}
              name={channel.name}
              description={channel.description}
              enabled={channel.enabled}
              disabled={loading}
              onToggle={(v) => toggleChannel(channel.id, v)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">WhatsApp (Twilio)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">
              Teléfono E.164
            </Label>
            <Input
              id="phone"
              className="h-11 text-base"
              placeholder="+54911..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground sm:text-base">
                Opt-in WhatsApp
              </p>
              <p className="text-sm text-muted-foreground">
                Alertas críticas con mapa del hotspot
              </p>
            </div>
            <Switch
              checked={
                whatsappOptIn || channels.some((c) => c.id === 'whatsapp' && c.enabled)
              }
              onCheckedChange={(v) => {
                setWhatsappOptIn(v);
                toggleChannel('whatsapp', v);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Tipos de alerta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(alertTypes) as AlertTypeKey[]).map((type) => {
            const config = alertTypes[type];
            return (
              <div
                key={type}
                className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    {labelAlertType(type)}
                  </h3>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={() => toggleAlertType(type)}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-muted-foreground">Severidad mínima</span>
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground sm:w-auto"
                    value={config.severity}
                    onChange={(e) => setTypeSeverity(type, e.target.value)}
                  >
                    <option value="critical">{labelAlertSeverity('critical')}</option>
                    <option value="warning">{labelAlertSeverity('warning')}</option>
                    <option value="info">{labelAlertSeverity('info')}</option>
                  </select>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="glass-card min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Horario silencioso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Las alertas críticas siguen llegando fuera del horario configurado.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
              <label className="mb-2 block text-sm text-muted-foreground">Desde</label>
              <input
                type="time"
                defaultValue="22:00"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
              <label className="mb-2 block text-sm text-muted-foreground">Hasta</label>
              <input
                type="time"
                defaultValue="06:00"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Alertas por campo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acceso rápido al monitoreo de cada lote
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium text-foreground sm:text-base">
                {field.name} · {getCropLabelEs(field.crop)}
              </span>
              <Button variant="outline" size="sm" className="h-9 shrink-0" asChild>
                <Link href={`/monitor?field=${field.id}`}>Monitorear</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 pb-4 sm:flex-row">
        <Button className="h-11 flex-1" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1"
          onClick={handleReset}
          disabled={saving}
        >
          Restablecer
        </Button>
      </div>
    </PageContainer>
  );
}
