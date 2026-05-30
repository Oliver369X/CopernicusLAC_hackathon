export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
}

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  mediaUrl?: string
): Promise<boolean> {
  if (!isTwilioConfigured()) return false;

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!;

  const normalizedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const params = new URLSearchParams({
    From: from,
    To: normalizedTo,
    Body: body,
  });
  if (mediaUrl) params.set('MediaUrl', mediaUrl);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  return res.ok;
}
