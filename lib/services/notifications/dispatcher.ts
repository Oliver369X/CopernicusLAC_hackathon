import type { DbClient } from '@/lib/db/adapter';
import type { DbAlertInsert } from '@/lib/cron/jobs';
import { sendWhatsAppMessage, isTwilioConfigured } from './twilio-whatsapp';

export async function dispatchAlertNotifications(
  service: DbClient,
  alert: DbAlertInsert,
  alertId: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (process.env.VAPID_PRIVATE_KEY && alert.severity === 'critical') {
    const secret = process.env.INTERNAL_API_SECRET ?? process.env.CRON_SECRET;
    await fetch(`${appUrl}/api/push`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({
        title: alert.title,
        body: alert.description.slice(0, 120),
      }),
    }).catch(() => undefined);
  }

  if (!isTwilioConfigured()) return;

  const { data: profiles } = await service
    .from('user_profiles')
    .select('phone')
    .eq('whatsapp_opt_in', true)
    .not('phone', 'is', null)
    .limit(5);

  const mapUrl =
    alert.metrics.hotspotLink && typeof alert.metrics.hotspotLink === 'string'
      ? undefined
      : alert.type === 'hotspot_stress'
        ? `${appUrl}/api/satellite/tiles?layer=ndre&bbox=${alert.metrics.bbox ?? ''}`
        : undefined;

  const message =
    alert.type === 'science_multisensor'
      ? `Doctor Soya — Science Lab\n${alert.title}\n${alert.description.slice(0, 220)}\n${alert.recommendation.slice(0, 120)}`
      : `Doctor Soya — ${alert.title}\n${alert.description.slice(0, 200)}\n${alert.recommendation.slice(0, 150)}`;

  for (const profile of profiles ?? []) {
    const phone = profile.phone != null ? String(profile.phone) : '';
    if (phone) {
      await sendWhatsAppMessage(phone, message, mapUrl);
    }
  }
}
