import type { VisionAnalysis } from '@/lib/mock-data/vision-analyzer';
import { analyzeImageMock } from '@/lib/mock-data/vision-analyzer';

const VISION_PROMPT = `You are an agricultural plant pathologist. Analyze crop images and return JSON with:
overallHealth (excellent|good|warning|critical), healthScore (0-100), confidence (0-1),
detectedDiseases (array with disease, confidence, severity, affectedArea, description, recommendations),
leafCondition (color, spotting, wilt, necrosis booleans), moistureStatus, nutritionStatus.
Return valid JSON only.`;

export async function analyzeCropImageMistral(
  imageBase64: string,
  cropType: string
): Promise<VisionAnalysis> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return analyzeImageMock();

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'system',
            content: `${VISION_PROMPT} Crop: ${cropType}.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this crop image.' },
              { type: 'image_url', image_url: imageBase64 },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      }),
    });

    if (!res.ok) return analyzeImageMock();

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return analyzeImageMock();

    const parsed = JSON.parse(content) as Omit<VisionAnalysis, 'timestamp'>;
    return { ...parsed, timestamp: new Date() };
  } catch {
    return analyzeImageMock();
  }
}
