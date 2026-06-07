/** Escenarios demo Lab — cooperativa vs pequeña agricultora (San Julián). */

export type DemoPersonaId = 'cooperative' | 'smallholder';

export interface DemoPersona {
  id: DemoPersonaId;
  label: string;
  subtitle: string;
  areaLabel: string;
  narrativeTone: 'analyst' | 'producer';
}

export interface DemoFieldScenario {
  fieldId: string;
  parcelKey: string;
  regionCode: string;
  persona: DemoPersonaId;
  highlight: string;
  areaHa: number;
}

export const DEMO_PERSONAS: Record<DemoPersonaId, DemoPersona> = {
  cooperative: {
    id: 'cooperative',
    label: 'Cooperativa Aura Agro',
    subtitle: 'Gestión por zonas · ~650 ha · 11 subparcelas',
    areaLabel: 'Escala grande',
    narrativeTone: 'analyst',
  },
  smallholder: {
    id: 'smallholder',
    label: 'Finca María',
    subtitle: 'Productora familiar · 19 ha · 3 cultivos',
    areaLabel: 'Escala pequeña',
    narrativeTone: 'producer',
  },
};

export const DEMO_PERSONA_NARRATIVES: Record<DemoPersonaId, string> = {
  cooperative:
    'Vista analítica para técnicos: zonas, tendencias regionales y alertas cruzadas entre subparcelas SJ.',
  smallholder:
    'Vista directa para la productora: una parcela, lectura simple y contexto histórico de su chacra PF.',
};

export const DEMO_FIELD_SCENARIOS: readonly DemoFieldScenario[] = [
  {
    fieldId: 'field-sj-norte',
    parcelKey: 'SJ-NORTE-001',
    regionCode: 'SC-BO',
    persona: 'cooperative',
    highlight: '6 zonas · roya y estrés hídrico',
    areaHa: 150,
  },
  {
    fieldId: 'field-sj-este',
    parcelKey: 'SJ-ESTE-001',
    regionCode: 'SC-BO',
    persona: 'cooperative',
    highlight: 'Maíz VT–R1 · dosel alto',
    areaHa: 200,
  },
  {
    fieldId: 'field-sj-oeste',
    parcelKey: 'SJ-OESTE-001',
    regionCode: 'SC-BO',
    persona: 'cooperative',
    highlight: 'Trigo · roya y septoria',
    areaHa: 120,
  },
  {
    fieldId: 'field-sj-sur',
    parcelKey: 'SJ-SUR-001',
    regionCode: 'SC-BO',
    persona: 'cooperative',
    highlight: 'Soja emergencia · riesgo bacteriano',
    areaHa: 180,
  },
  {
    fieldId: 'field-pf-soja',
    parcelKey: 'PF-SOJA-001',
    regionCode: 'SC-BO',
    persona: 'smallholder',
    highlight: 'Chacra 8 ha · vigor estable',
    areaHa: 8,
  },
  {
    fieldId: 'field-pf-maiz',
    parcelKey: 'PF-MAIZ-001',
    regionCode: 'SC-BO',
    persona: 'smallholder',
    highlight: 'Maíz 6 ha · excelente biomasa',
    areaHa: 6,
  },
  {
    fieldId: 'field-pf-trigo',
    parcelKey: 'PF-TRIGO-001',
    regionCode: 'SC-BO',
    persona: 'smallholder',
    highlight: 'Trigo 5 ha · alerta roya',
    areaHa: 5,
  },
] as const;

export function getDemoScenario(fieldId: string): DemoFieldScenario | undefined {
  return DEMO_FIELD_SCENARIOS.find((s) => s.fieldId === fieldId);
}

export function listDemoScenariosByPersona(
  persona: DemoPersonaId
): DemoFieldScenario[] {
  return DEMO_FIELD_SCENARIOS.filter((s) => s.persona === persona);
}

export function getDemoTourLinks(crop: string): { cooperative: string; smallholder: string } {
  const coopField =
    crop === 'corn'
      ? 'field-sj-este'
      : crop === 'wheat'
        ? 'field-sj-oeste'
        : 'field-sj-norte';
  const smallField =
    crop === 'corn'
      ? 'field-pf-maiz'
      : crop === 'wheat'
        ? 'field-pf-trigo'
        : 'field-pf-soja';
  return {
    cooperative: `/science/${crop}?field=${coopField}&tab=lab`,
    smallholder: `/science/${crop}?field=${smallField}&tab=lab`,
  };
}
