'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';

interface AlertChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  description: string;
}

export default function AlertSettings() {
  const [channels, setChannels] = useState<AlertChannel[]>([
    {
      id: 'in-app',
      name: 'In-App Notifications',
      icon: <Bell className="h-5 w-5" />,
      enabled: true,
      description: 'Get notified within the Doctor Soya app',
    },
    {
      id: 'email',
      name: 'Email Alerts',
      icon: <Mail className="h-5 w-5" />,
      enabled: true,
      description: 'Receive alerts via email',
    },
    {
      id: 'sms',
      name: 'SMS Alerts',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: false,
      description: 'Get critical alerts via SMS',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Alerts',
      icon: <Phone className="h-5 w-5" />,
      enabled: false,
      description: 'Critical alerts with hotspot map via Twilio WhatsApp',
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: <MessageSquare className="h-5 w-5" />,
      enabled: true,
      description: 'Desktop and mobile push notifications',
    },
  ]);

  const [alertTypes, setAlertTypes] = useState({
    disease: { enabled: true, severity: 'critical' },
    threshold: { enabled: true, severity: 'warning' },
    predictive: { enabled: true, severity: 'warning' },
    anomaly: { enabled: true, severity: 'info' },
  });

  const [phone, setPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const toggleChannel = (id: string) => {
    setChannels(channels.map((ch) => (ch.id === id ? { ...ch, enabled: !ch.enabled } : ch)));
  };

  const toggleAlertType = (type: string) => {
    setAlertTypes((prev) => ({
      ...prev,
      [type]: { ...prev[type as keyof typeof alertTypes], enabled: !prev[type as keyof typeof alertTypes].enabled },
    }));
  };

  useEffect(() => {
    fetch('/api/alerts/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          const types = ['disease', 'threshold', 'predictive', 'anomaly'] as const;
          setAlertTypes((prev) => {
            const next = { ...prev };
            types.forEach((t) => {
              if (data.config[t]) {
                next[t] = {
                  enabled: data.config[t].enabled ?? true,
                  severity: data.config[t].severity ?? prev[t].severity,
                };
              }
            });
            return next;
          });
        }
        if (data.profile) {
          setPhone(data.profile.phone ?? '');
          setWhatsappOptIn(Boolean(data.profile.whatsapp_opt_in));
          if (data.profile.whatsapp_opt_in) {
            setChannels((prev) =>
              prev.map((c) => (c.id === 'whatsapp' ? { ...c, enabled: true } : c))
            );
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
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

    if (res.ok) {
      await fetch('/api/alerts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || undefined,
          whatsappOptIn: channels.find((c) => c.id === 'whatsapp')?.enabled ?? whatsappOptIn,
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
    } else {
      toast.error('Error al guardar');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Alert Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure how and when you receive notifications
        </p>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-primary">{channel.icon}</div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{channel.name}</p>
                  <p className="text-xs text-muted-foreground">{channel.description}</p>
                </div>
              </div>

              <Button
                variant={channel.enabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleChannel(channel.id)}
                className="min-w-[100px]"
              >
                {channel.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">WhatsApp (Twilio)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono E.164</Label>
            <Input
              id="phone"
              placeholder="+54911..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Opt-in WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Alertas críticas con mapa del hotspot
              </p>
            </div>
            <Switch
              checked={whatsappOptIn || channels.some((c) => c.id === 'whatsapp' && c.enabled)}
              onCheckedChange={(v) => {
                setWhatsappOptIn(v);
                setChannels((prev) =>
                  prev.map((c) => (c.id === 'whatsapp' ? { ...c, enabled: v } : c))
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(alertTypes).map(([type, config]) => (
              <div
                key={type}
                className="p-4 rounded-lg border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground capitalize">{type} Alerts</h3>
                  <Button
                    variant={config.enabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleAlertType(type)}
                    className="min-w-[100px]"
                  >
                    {config.enabled ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Alert Severity</span>
                  <select
                    className="px-2 py-1 rounded border border-border bg-background text-sm text-foreground"
                    defaultValue={config.severity}
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quiet Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Enable Quiet Hours</p>
              <p className="text-xs text-muted-foreground">Suppress non-critical alerts during specified times</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-border">
              <label className="block text-xs text-muted-foreground mb-2">Start Time</label>
              <input
                type="time"
                defaultValue="22:00"
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground"
              />
            </div>
            <div className="p-3 rounded-lg border border-border">
              <label className="block text-xs text-muted-foreground mb-2">End Time</label>
              <input
                type="time"
                defaultValue="06:00"
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-primary/5">
            <p className="text-xs text-primary">
              Critical alerts will still be delivered during quiet hours
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Field Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Per-Field Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Configure specific alerts for each field
          </p>

          <div className="space-y-2">
            {MOCK_FIELDS.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <span className="text-sm text-foreground">{field.name}</span>
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={handleSave}>Save Settings</Button>
        <Button variant="outline" className="flex-1">
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
