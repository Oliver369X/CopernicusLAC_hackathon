import OpenAI from 'openai';
import type { VisionAnalysis } from '@/lib/mock-data/vision-analyzer';
import { analyzeImageMock } from '@/lib/mock-data/vision-analyzer';
import { analyzeCropImageMistral } from '@/lib/services/mistral-vision';
import { buildCropExpertSystemPrompt } from '@/lib/prompts/crop-expert';
import type { CropType } from '@/lib/mock-data/crops';
import type { SatelliteContext } from '@/lib/services/satellite-correlation';

function normalizeCropType(crop: string): CropType {
  if (crop === 'maize' || crop === 'soy') return crop === 'maize' ? 'corn' : 'soybean';
  return crop as CropType;
}

const VISION_SCHEMA = {
  type: 'object' as const,
  properties: {
    overallHealth: { type: 'string', enum: ['excellent', 'good', 'warning', 'critical'] },
    healthScore: { type: 'number' },
    confidence: { type: 'number' },
    detectedDiseases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          disease: { type: 'string' },
          confidence: { type: 'number' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          affectedArea: { type: 'number' },
          description: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    leafCondition: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        spotting: { type: 'boolean' },
        wilt: { type: 'boolean' },
        necrosis: { type: 'boolean' },
      },
    },
    moistureStatus: { type: 'string' },
    nutritionStatus: { type: 'string' },
  },
};

export async function analyzeCropImage(
  imageBase64: string,
  cropType: string,
  satelliteContext?: SatelliteContext,
  scienceAnalysis?: import('@/lib/science/types').MultisensorAnalysis | null
): Promise<VisionAnalysis> {
  const provider = process.env.VISION_PROVIDER ?? 'openai';

  if (provider === 'mistral' && process.env.MISTRAL_API_KEY) {
    return analyzeCropImageMistral(imageBase64, cropType);
  }

  if (!process.env.OPENAI_API_KEY) {
    if (process.env.MISTRAL_API_KEY) {
      return analyzeCropImageMistral(imageBase64, cropType);
    }
    return analyzeImageMock();
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = buildCropExpertSystemPrompt(
    normalizeCropType(cropType),
    satelliteContext,
    scienceAnalysis
  );

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this crop image for health and diseases. Return structured JSON.',
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'vision_analysis',
          schema: VISION_SCHEMA,
        },
      },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return analyzeImageMock();

    const parsed = JSON.parse(content) as Omit<VisionAnalysis, 'timestamp'>;
    return { ...parsed, timestamp: new Date() };
  } catch {
    return analyzeImageMock();
  }
}
