/** Textos en lenguaje claro para el Lab (productor y cooperativa). */

export const SCIENCE_LAB_TOUR_STORAGE_KEY = 'ds_science_lab_tour_v1';
export const SCIENCE_LAB_GOAL_STORAGE_KEY = 'ds_science_lab_goal_v1';

export type LabGoalId =
  | 'worry-yellow'
  | 'compare-neighbors'
  | 'see-history'
  | 'not-sure'
  | 'zone-stress'
  | 'demo-scales'
  | 'full-experiment';

export interface LabGoalOption {
  id: LabGoalId;
  emoji: string;
  question: string;
  hint: string;
  hypothesis: string;
  opensCompare?: boolean;
  loadsAnalysis?: boolean;
}

export const SMALLHOLDER_GOALS: LabGoalOption[] = [
  {
    id: 'worry-yellow',
    emoji: '🌾',
    question: 'Se ve amarilla o con poca hoja',
    hint: 'Revisamos vigor y humedad de tu parcela.',
    hypothesis: 'Quiero saber si mi parcela perdió vigor esta semana.',
    loadsAnalysis: true,
  },
  {
    id: 'compare-neighbors',
    emoji: '🏘️',
    question: 'Comparar con la cooperativa del pueblo',
    hint: 'Tu chacra al lado de la escala grande (misma zona).',
    hypothesis: 'Quiero ver si mi parcela va parecido a la cooperativa.',
    opensCompare: true,
  },
  {
    id: 'see-history',
    emoji: '📅',
    question: 'Ver cómo estuvo el año pasado',
    hint: 'Gráfico mes a mes sin tecnicismos.',
    hypothesis: 'Quiero entender la tendencia de mi parcela en los últimos meses.',
  },
  {
    id: 'not-sure',
    emoji: '💬',
    question: 'No estoy segura — mostrame un resumen simple',
    hint: 'Te guiamos paso a paso con lo básico.',
    hypothesis: 'Necesito un resumen claro del estado de mi parcela hoy.',
    loadsAnalysis: true,
  },
];

export const COOPERATIVE_GOALS: LabGoalOption[] = [
  {
    id: 'zone-stress',
    emoji: '⚠️',
    question: 'Hay una zona con posible estrés',
    hint: 'Cargamos lectura satelital y alertas de la subparcela.',
    hypothesis: 'Quiero confirmar estrés en la zona seleccionada con satélite.',
    loadsAnalysis: true,
  },
  {
    id: 'demo-scales',
    emoji: '⚖️',
    question: 'Comparar finca pequeña vs cooperativa',
    hint: 'Demo San Julián: PF vs SJ en la misma región.',
    hypothesis: 'Comparar escala pequeña productora vs gestión por zonas cooperativa.',
    opensCompare: true,
  },
  {
    id: 'see-history',
    emoji: '📈',
    question: 'Revisar historial de la parcela',
    hint: 'Serie temporal antes de formular hipótesis.',
    hypothesis: 'Revisar tendencia histórica antes de decidir manejo.',
  },
  {
    id: 'full-experiment',
    emoji: '🔬',
    question: 'Experimento técnico (índices avanzados)',
    hint: 'Plantillas NDVI/NDRE y fusión ML.',
    hypothesis: 'Experimento multisensor con hipótesis formal.',
    loadsAnalysis: true,
  },
];

export const PLAIN_METRIC_LABELS = {
  ndvi: 'Verdor del cultivo',
  sarMoisture: 'Humedad del suelo',
  hotspots: 'Incendios cerca (7 días)',
  trend: 'Tendencia reciente',
  confidence: 'Confianza del dato',
} as const;

export function getLabGoals(simpleMode: boolean): LabGoalOption[] {
  return simpleMode ? SMALLHOLDER_GOALS : COOPERATIVE_GOALS;
}
