import type { CropType } from '@/lib/mock-data/crops';
import type { DiseaseKnowledgeEntry } from '@/lib/diagnostics/types';

/** Base de conocimiento fitosanitario — Argentina / Cono Sur. Fuentes: INTA, manejo integrado, índices Copernicus. */
export const DISEASE_KNOWLEDGE: DiseaseKnowledgeEntry[] = [
  {
    id: 'frogeye-leaf-spot',
    aliases: ['frogeye leaf spot', 'mancha ojo de rana', 'cercospora sojina'],
    crops: ['soybean'],
    nameEs: 'Mancha ojo de rana',
    scientificName: 'Cercospora sojina',
    pathogenType: 'fungal',
    causalAgent: 'Cercospora sojina (hongo)',
    symptoms: [
      'Lesiones circulares con halo rojizo y centro gris-marrón',
      'Defoliación prematura en tercio inferior',
      'Reducción de área foliar fotosintética',
    ],
    favorableConditions: [
      'Alta humedad relativa y rocío prolongado',
      'Temperaturas 22–30 °C',
      'Monocultivo de soja y residuos infectados',
    ],
    economicThreshold: 'Intervenir cuando >10% del área foliar presenta lesiones activas en R3–R5.',
    ndviAlertBelow: 0.45,
    ndmiAlertBelow: 0.35,
    satelliteInterpretation:
      'NDVI heterogéneo con parches de baja biomasa; NDMI estable sugiere patógeno foliar más que estrés hídrico severo.',
    immediateActions: [
      'Delimitar foco y registrar GPS del muestreo',
      'Evitar tránsito de maquinaria mojada entre lotes',
      'Fotografiar tercio medio del dosel para seguimiento',
    ],
    shortTermManagement: [
      'Aplicar fungicida triazol + estrobilurina según etiqueta y fenología',
      'Priorizar zonas con NDVI < umbral y lesiones activas',
      'Reevaluar a 7–10 días post-aplicación',
    ],
    preventiveMeasures: [
      'Rotación con especies no hospederas (mín. 2 años)',
      'Variedades tolerantes certificadas',
      'Manejo de rastrojo y ventilación del dosel',
    ],
    criticalPhenology: 'R3–R5 (formación y llenado de vainas)',
    monitoringInterval: 'Cada 5–7 días en condiciones húmedas',
  },
  {
    id: 'asian-soybean-rust',
    aliases: [
      'asian soybean rust',
      'roya asiática de la soja',
      'roya asiatica',
      'phakopsora pachyrhizi',
      'rust',
      'roya',
    ],
    crops: ['soybean'],
    nameEs: 'Roya asiática de la soja',
    scientificName: 'Phakopsora pachyrhizi',
    pathogenType: 'fungal',
    causalAgent: 'Phakopsora pachyrhizi (hongo)',
    symptoms: [
      'Pústulas minúsculas color herrumbre en envés foliar',
      'Clorosis y defoliación acelerada',
      'Pérdida de rendimiento si afecta R4–R6',
    ],
    favorableConditions: [
      'Rocío nocturno >10 h y humedad >90%',
      'Temperaturas 18–26 °C',
      'Inóculo transportado por viento desde lotes vecinos',
    ],
    economicThreshold: 'Umbral bajo: 1 pústula por folíolo en etapa reproductiva → acción inmediata.',
    ndviAlertBelow: 0.48,
    ndmiAlertBelow: 0.38,
    satelliteInterpretation:
      'Caída rápida de NDVI en manchas; NDMI puede mantenerse hasta defoliación avanzada.',
    immediateActions: [
      'Alerta fitosanitaria al equipo y lotes limítrofes',
      'Fungicida sistémico en ventana de 24–48 h si confirma R1+',
      'Suspender labores que dispersen inóculo',
    ],
    shortTermManagement: [
      'Dos aplicaciones espaciadas según persistencia del producto',
      'Mapa de prescripción por zonas NDVI críticas',
      'Monitoreo diario con lupa en tercio inferior',
    ],
    preventiveMeasures: [
      'Calendario preventivo en campañas de alto riesgo regional',
      'Variedades de ciclo acorde a ventana libre de roya',
      'Eliminación de kudzu y hospederos alternativos',
    ],
    criticalPhenology: 'R1–R5',
    monitoringInterval: 'Diario en alerta regional; semanal en baja presión',
  },
  {
    id: 'powdery-mildew-soy',
    aliases: [
      'powdery mildew',
      'oídio',
      'oidio',
      'erysiphe diffusa',
      'fungal leaf spot',
      'fungal leaf lesion',
      'unspecified fungal',
    ],
    crops: ['soybean', 'wheat'],
    nameEs: 'Oídio',
    scientificName: 'Erysiphe diffusa / Blumeria graminis',
    pathogenType: 'fungal',
    causalAgent: 'Erysiphe spp. (hongo biotrófico)',
    symptoms: [
      'Polvo blanco harinoso en superficie foliar',
      'Encrespamiento y reducción fotosintética',
      'Senescencia prematura',
    ],
    favorableConditions: [
      'Alta humedad sin agua libre en hoja',
      'Densidades elevadas y poca aireación',
      'Exceso de nitrógeno',
    ],
    economicThreshold: 'Tratar si >15% de plantas con colonias activas antes de R4.',
    ndviAlertBelow: 0.5,
    ndmiAlertBelow: 0.4,
    satelliteInterpretation:
      'NDVI moderadamente reducido; NDMI alto puede indicar dosel denso favoreciendo oídio.',
    immediateActions: [
      'Registrar severidad por cuadrante',
      'Evitar aplicaciones en horas de alta radiación',
    ],
    shortTermManagement: [
      'Fungicida específico (triazol / estrobilurina) según etiqueta',
      'Ajustar dosis por cobertura del dosel',
    ],
    preventiveMeasures: [
      'Manejo de densidad y fertilización balanceada',
      'Monitoreo temprano en microclimas húmedos',
    ],
    criticalPhenology: 'V6–R3',
    monitoringInterval: 'Cada 7 días',
  },
  {
    id: 'sds',
    aliases: ['sudden death syndrome', 'sds', 'síndrome de muerte súbita', 'muerte subita'],
    crops: ['soybean'],
    nameEs: 'Síndrome de muerte súbita (SDS)',
    scientificName: 'Fusarium virguliforme',
    pathogenType: 'fungal',
    causalAgent: 'Fusarium virguliforme (hongo del suelo)',
    symptoms: [
      'Clorosis internervial seguida de necrosis',
      'Marchitez en V–R5 pese a humedad aparente',
      'Raíces con discoloración interna',
    ],
    favorableConditions: [
      'Suelos compactados y mal drenados',
      'Infección temprana + estrés de floración',
      'Presencia de Heterodera glycines (nematodo)',
    ],
    economicThreshold: 'No hay cura en planta afectada; focos >5% del lote requieren plan de rotación.',
    ndviAlertBelow: 0.4,
    ndmiAlertBelow: 0.25,
    satelliteInterpretation:
      'Parches de NDVI muy bajo alineados a microrelieve mal drenado; NDMI puede ser engañoso.',
    immediateActions: [
      'Confirmar en raíz (corte longitudinal)',
      'Marcar focos para muestreo de suelo post-cosecha',
    ],
    shortTermManagement: [
      'Evitar estrés hídrico en R2–R4 en zonas limítrofes',
      'No aplicar fungicidas foliares (ineficaces para SDS)',
    ],
    preventiveMeasures: [
      'Variedades tolerantes + tratamiento de semilla',
      'Mejorar drenaje y reducir compactación',
      'Rotación ≥3 años y manejo de nematodos',
    ],
    criticalPhenology: 'R2–R5',
    monitoringInterval: 'Semanal en suelos históricamente afectados',
  },
  {
    id: 'bacterial-blight',
    aliases: ['bacterial blight', 'tizón bacteriano', 'pseudomonas syringae'],
    crops: ['soybean'],
    nameEs: 'Tizón bacteriano',
    scientificName: 'Pseudomonas syringae pv. glycinea',
    pathogenType: 'bacterial',
    causalAgent: 'Pseudomonas syringae (bacteria)',
    symptoms: [
      'Lesiones angulosas acuosas en hojas',
      'Halo amarillo y caída de hojas jóvenes',
      'Dispersión por lluvia y rocío',
    ],
    favorableConditions: [
      'Lluvias frecuentes y heridas foliares',
      'Temperaturas moderadas 20–28 °C',
      'Semilla infectada',
    ],
    economicThreshold: 'Acción si >8% hojas con lesiones activas en etapas vegetativas.',
    ndviAlertBelow: 0.42,
    satelliteInterpretation: 'Manchas irregulares de estrés; correlación con eventos de granizo o helada.',
    immediateActions: [
      'No trabajar el lote con follaje mojado',
      'Retirar restos severamente afectados del borde',
    ],
    shortTermManagement: [
      'Cobre o antibióticos permitidos según normativa local',
      'Evitar irrigación por aspersión',
    ],
    preventiveMeasures: [
      'Semilla certificada y desinfección de equipos',
      'Rotación y eliminación de residuos',
    ],
    monitoringInterval: 'Cada 5 días tras lluvias',
  },
  {
    id: 'septoria-soy',
    aliases: ['septoria leaf spot', 'septoria glycines', 'mancha septoria'],
    crops: ['soybean'],
    nameEs: 'Mancha Septoria',
    scientificName: 'Septoria glycines',
    pathogenType: 'fungal',
    causalAgent: 'Septoria glycines',
    symptoms: [
      'Lesiones angulosas marrón-gris con puntos picnidios',
      'Progresión de abajo hacia arriba',
    ],
    favorableConditions: ['Rocío prolongado', 'Residuos de soja', 'Temperaturas templadas'],
    economicThreshold: 'Fungicida si severidad >15% en tercio medio en R3.',
    ndviAlertBelow: 0.46,
    satelliteInterpretation: 'Declive gradual de NDVI; patrón más uniforme que roya.',
    immediateActions: ['Muestreo sistemático cada 20 m', 'Foto de contraste con hoja sana'],
    shortTermManagement: ['Fungicida protectante + sistémico', 'Focalizar en NDVI bajo'],
    preventiveMeasures: ['Rotación', 'Variedades tolerantes', 'Manejo de rastrojo'],
    monitoringInterval: 'Semanal',
  },
  {
    id: 'gray-leaf-spot',
    aliases: ['gray leaf spot', 'mancha gris de la hoja', 'cercospora zeae-maydis'],
    crops: ['corn'],
    nameEs: 'Mancha gris del maíz',
    scientificName: 'Cercospora zeae-maydis',
    pathogenType: 'fungal',
    causalAgent: 'Cercospora zeae-maydis',
    symptoms: [
      'Lesiones rectangulares grises paralelas a venas',
      'Necrosis desde tercio inferior',
    ],
    favorableConditions: [
      'Monocultivo maíz',
      'Alta humedad y temperaturas 25–30 °C',
      'Rastrojo en superficie',
    ],
    economicThreshold: 'Tratar en V12–VT si lesiones en tercio inferior >50%.',
    ndviAlertBelow: 0.5,
    ndmiAlertBelow: 0.35,
    satelliteInterpretation: 'NDVI cae desde bordes de lotes con historial de rastrojo.',
    immediateActions: ['Scouting en V10+', 'Priorizar híbridos sensibles'],
    shortTermManagement: ['Fungicida en VT–R1', 'Prescripción por zona NDVI'],
    preventiveMeasures: ['Rotación', 'Labranza de residuos', 'Híbridos tolerantes'],
    criticalPhenology: 'V12–R2',
    monitoringInterval: 'Cada 7 días post V10',
  },
  {
    id: 'northern-corn-leaf-blight',
    aliases: ['northern corn leaf blight', 'nclb', 'helmintosporiosis del maíz'],
    crops: ['corn'],
    nameEs: 'Tizón foliar del maíz (NCLB)',
    scientificName: 'Exserohilum turcicum',
    pathogenType: 'fungal',
    causalAgent: 'Exserohilum turcicum',
    symptoms: [
      'Lesiones elípticas 3–15 cm color haba',
      'Necrosis en condiciones húmedas',
    ],
    favorableConditions: ['Rocío nocturno', 'Temperaturas 18–27 °C', 'Rastrojo de maíz'],
    economicThreshold: 'Aplicación si lesiones en 50% plantas y 5% área foliar.',
    ndviAlertBelow: 0.45,
    satelliteInterpretation: 'Parches grandes de estrés foliar; NDMI variable.',
    immediateActions: ['Confirmar en VT', 'Evitar estrés hídrico simultáneo'],
    shortTermManagement: ['Fungicida en VT–R1', 'Segunda aplicación si persistencia <14 d'],
    preventiveMeasures: ['Híbridos con resistencia parcial', 'Rotación'],
    criticalPhenology: 'VT–R1',
    monitoringInterval: 'Semanal en VT',
  },
  {
    id: 'southern-rust',
    aliases: ['southern rust', 'southern corn leaf blight', 'roya del maíz', 'puccinia polysora'],
    crops: ['corn'],
    nameEs: 'Roya del maíz',
    scientificName: 'Puccinia polysora',
    pathogenType: 'fungal',
    causalAgent: 'Puccinia polysora',
    symptoms: [
      'Pústulas pequeñas color canela en envés',
      'Progresión rápida en R1–R3',
    ],
    favorableConditions: ['Vientos del norte transportando inóculo', 'Alta humedad', 'R1–R3'],
    economicThreshold: 'Tratar de inmediato si pústulas en hoja bandera antes de R3.',
    ndviAlertBelow: 0.48,
    satelliteInterpretation: 'Caída abrupta de NDVI en ventana reproductiva.',
    immediateActions: ['Alerta regional', 'Fungicida curativo 24–72 h'],
    shortTermManagement: ['Revisión 7 d post-tratamiento', 'Mapa de focos'],
    preventiveMeasures: ['Monitoreo de redes de alerta', 'Híbridos tolerantes'],
    criticalPhenology: 'R1–R3',
    monitoringInterval: '2–3 veces por semana en alerta',
  },
  {
    id: 'septoria-wheat',
    aliases: ['septoria tritici', 'septoria tritici blotch', 'mancha marrón del trigo', 'zymoseptoria'],
    crops: ['wheat'],
    nameEs: 'Septoria / Mancha marrón del trigo',
    scientificName: 'Zymoseptoria tritici',
    pathogenType: 'fungal',
    causalAgent: 'Zymoseptoria tritici',
    symptoms: [
      'Lesiones marrón-necróticas con picnidios',
      'Amarillamiento desde punta de hoja',
    ],
    favorableConditions: ['Lluvias en macollaje y espigado', 'Rastrojo de trigo'],
    economicThreshold: 'Fungicida en encañado si flag leaf en riesgo (>5% severidad).',
    ndviAlertBelow: 0.48,
    satelliteInterpretation: 'NDVI bajo en zonas con historial de rastrojo; revisar humedad del suelo.',
    immediateActions: ['Muestreo en hoja bandera', 'Registrar estadio fenológico'],
    shortTermManagement: ['Fungicida triazol + SDHI en encañado', 'Ajuste por zona NDVI'],
    preventiveMeasures: ['Rotación', 'Siembra temprana controlada', 'Variedades tolerantes'],
    criticalPhenology: 'Encañado – espigado',
    monitoringInterval: 'Semanal en primavera',
  },
  {
    id: 'stripe-rust',
    aliases: ['stripe rust', 'roya amarilla', 'puccinia striiformis'],
    crops: ['wheat'],
    nameEs: 'Roya amarilla del trigo',
    scientificName: 'Puccinia striiformis f. sp. tritici',
    pathogenType: 'fungal',
    causalAgent: 'Puccinia striiformis',
    symptoms: [
      'Franjas amarillo-naranja paralelas a venas',
      'Reducción de fotosíntesis en hoja bandera',
    ],
    favorableConditions: ['Temperaturas 10–20 °C', 'Rocío prolongado', 'Variedades susceptibles'],
    economicThreshold: 'Aplicación preventiva si alerta regional o primeras pústulas.',
    ndviAlertBelow: 0.5,
    satelliteInterpretation: 'NDVI heterogéneo en lotes con variedad susceptible.',
    immediateActions: ['Confirmar con lupa', 'Fungicida preventivo en macollaje tardío'],
    shortTermManagement: ['Segunda aplicación si ciclo del producto < ventana crítica'],
    preventiveMeasures: ['Variedades con resistencia adulta', 'Monitoreo de redes regionales'],
    monitoringInterval: 'Cada 5 días en primavera fresca',
  },
  {
    id: 'drought-stress',
    aliases: ['drought stress', 'estrés hídrico', 'estres hidrico', 'sequía', 'water stress'],
    crops: ['soybean', 'corn', 'wheat', 'sunflower', 'cotton'],
    nameEs: 'Estrés hídrico',
    scientificName: 'Factor abiótico',
    pathogenType: 'abiotic',
    causalAgent: 'Déficit de agua disponible en suelo',
    symptoms: [
      'Encrespamiento foliar diurno',
      'Clorosis y aborto floral',
      'NDMI persistentemente bajo',
    ],
    favorableConditions: ['Déficit hídrico prolongado', 'Suelos superficiales', 'Altas ETP'],
    economicThreshold: 'Irrigar o priorizar lotes si NDMI <0.25 por >7 días en floración.',
    ndmiAlertBelow: 0.25,
    satelliteInterpretation: 'NDMI y NDVI bajos correlacionados; LST elevada (S3) refuerza diagnóstico.',
    immediateActions: [
      'Verificar humedad de suelo en raíz activa',
      'Priorizar riego en zonas reproductivas',
    ],
    shortTermManagement: [
      'Ajustar calendario de riego por zonas de manejo',
      'Reducir estrés adicional (no aplicar en horas pico)',
    ],
    preventiveMeasures: [
      'Manejo de cobertura y materia orgánica',
      'Zonificación por capacidad de almacenamiento hídrico',
    ],
    monitoringInterval: 'Diario en floración bajo estrés',
  },
  {
    id: 'healthy',
    aliases: ['healthy', 'saludable', 'no disease', 'sin enfermedad'],
    crops: ['soybean', 'corn', 'wheat', 'sunflower', 'cotton', 'barley', 'rice', 'canola'],
    nameEs: 'Cultivo sin patología detectable',
    scientificName: '—',
    pathogenType: 'unknown',
    causalAgent: 'Sin agente patogénico identificado',
    symptoms: ['Follaje con coloración y turgencia normales para el estadio'],
    favorableConditions: [],
    economicThreshold: 'Mantener monitoreo preventivo; no requiere intervención química.',
    satelliteInterpretation: 'NDVI/NDMI dentro de rangos esperados para fenología y cultivo.',
    immediateActions: ['Continuar scouting programado', 'Registrar línea base de índices'],
    shortTermManagement: ['Mantener plan de nutrición y riego', 'Documentar prácticas actuales'],
    preventiveMeasures: ['Monitoreo semanal', 'Alertas Copernicus activas'],
    monitoringInterval: 'Semanal',
  },
];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function resolveDiseaseKnowledge(
  diseaseName: string,
  crop?: CropType | string
): DiseaseKnowledgeEntry | null {
  const key = normalizeKey(diseaseName);
  if (!key) return null;

  const cropFilter = crop as CropType | undefined;

  for (const entry of DISEASE_KNOWLEDGE) {
    if (cropFilter && !entry.crops.includes(cropFilter)) continue;
    if (entry.aliases.some((a) => normalizeKey(a) === key)) return entry;
    if (normalizeKey(entry.nameEs) === key) return entry;
    if (normalizeKey(entry.id) === key) return entry;
  }

  for (const entry of DISEASE_KNOWLEDGE) {
    if (entry.aliases.some((a) => key.includes(normalizeKey(a)) || normalizeKey(a).includes(key))) {
      if (!cropFilter || entry.crops.includes(cropFilter)) return entry;
    }
  }

  return null;
}

export function getKnowledgeForCrop(crop: CropType): DiseaseKnowledgeEntry[] {
  return DISEASE_KNOWLEDGE.filter((e) => e.crops.includes(crop));
}
