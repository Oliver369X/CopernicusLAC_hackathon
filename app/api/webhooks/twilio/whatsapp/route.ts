import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createServiceClient } from '@/lib/supabase/server';
import { analyzeCropImage } from '@/lib/services/vision-service';
import { sendWhatsAppMessage } from '@/lib/services/notifications/twilio-whatsapp';

function verifyTwilio(request: Request): boolean {
  const secret = process.env.TWILIO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return request.headers.get('x-twilio-secret') === secret;
}

export async function POST(request: Request) {
  if (!verifyTwilio(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const from = String(form.get('From') ?? '');
  const body = String(form.get('Body') ?? '');
  const numMedia = Number(form.get('NumMedia') ?? 0);
  const mediaUrl = numMedia > 0 ? String(form.get('MediaUrl0') ?? '') : null;

  if (!mediaUrl) {
    await sendWhatsAppMessage(
      from.replace('whatsapp:', ''),
      'Doctor Soya: envíe una foto close-up de la hoja enferma para diagnóstico.'
    );
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const imgRes = await fetch(mediaUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const imageData = `data:image/jpeg;base64,${buf.toString('base64')}`;

  const analysis = await analyzeCropImage(imageData, 'soybean');
  const reply = `Diagnóstico: ${analysis.overallHealth} (${analysis.healthScore}/100). ${
    analysis.detectedDiseases[0]?.disease ?? 'Sin enfermedad clara'
  }. ${analysis.detectedDiseases[0]?.recommendations[0] ?? 'Monitorear zona.'}`;

  await sendWhatsAppMessage(from.replace('whatsapp:', ''), reply);

  if (isDatabaseConfigured()) {
    const service = await createServiceClient();
    await service.from('observations').insert({
      id: `wa-${Date.now()}`,
      field_id: 'field-1',
      notes: body,
      image_url: mediaUrl,
      vision_result: analysis,
    });
  }

  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
