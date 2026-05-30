export type CropType = 'soybean' | 'corn' | 'wheat' | 'cotton' | 'sunflower' | 'canola' | 'barley' | 'rice';

export interface CropDiseaseProfile {
  disease: string;
  description: string;
  symptoms: string[];
  ndviThreshold: number; // Below this = risk
  ndmiThreshold: number; // Below this = risk
  temperatureOptimal: [number, number]; // Min-max
  moistureOptimal: [number, number]; // Min-max (%)
  transmissionRisk: 'high' | 'medium' | 'low';
  controlMeasures: string[];
}

export interface CropGrowthStage {
  stage: string;
  daysFromPlanting: [number, number];
  ndviRange: [number, number];
  criticalIssues: string[];
  waterNeeds: 'low' | 'medium' | 'high';
}

export interface CropProfile {
  id: CropType;
  name: string;
  scientificName: string;
  plantingWindow: [number, number]; // month range
  cycleLength: number; // days
  diseases: CropDiseaseProfile[];
  growthStages: CropGrowthStage[];
  ndviRange: [number, number];
  healthyColor: string;
  warningColor: string;
  criticalColor: string;
}

export const CROP_PROFILES: Record<CropType, CropProfile> = {
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    scientificName: 'Glycine max',
    plantingWindow: [10, 12],
    cycleLength: 120,
    ndviRange: [0.3, 0.85],
    healthyColor: '#22c55e',
    warningColor: '#eab308',
    criticalColor: '#ef4444',
    diseases: [
      {
        disease: 'Frogeye Leaf Spot',
        description: 'Fungal disease causing circular leaf lesions with reddish borders',
        symptoms: ['Circular spots on leaves', 'Reddish borders', 'Brown centers', 'Premature defoliation'],
        ndviThreshold: 0.45,
        ndmiThreshold: 0.35,
        temperatureOptimal: [15, 25],
        moistureOptimal: [60, 80],
        transmissionRisk: 'high',
        controlMeasures: ['Crop rotation', 'Fungicide spray', 'Remove infected plant debris', 'Use resistant varieties'],
      },
      {
        disease: 'Powdery Mildew',
        description: 'White powdery fungal coating on leaves reducing photosynthesis',
        symptoms: ['White powder on leaves', 'Leaf curl', 'Premature senescence'],
        ndviThreshold: 0.50,
        ndmiThreshold: 0.40,
        temperatureOptimal: [20, 27],
        moistureOptimal: [40, 60],
        transmissionRisk: 'medium',
        controlMeasures: ['Sulfur dust application', 'Increase air circulation', 'Reduce nitrogen', 'Monitor closely'],
      },
      {
        disease: 'Sudden Death Syndrome (SDS)',
        description: 'Xylem-colonizing fungus causing yellowing and interveinal necrosis',
        symptoms: ['Interveinal yellowing', 'Rapid leaf death', 'Root rot', 'Wilting'],
        ndviThreshold: 0.40,
        ndmiThreshold: 0.25,
        temperatureOptimal: [18, 26],
        moistureOptimal: [70, 95],
        transmissionRisk: 'high',
        controlMeasures: ['Seed treatment', 'Drainage improvement', 'Crop rotation (3+ years)', 'Resistant varieties'],
      },
      {
        disease: 'Rust (Asian)',
        description: 'Fungal rust causing pustules on leaf undersides',
        symptoms: ['Rust-colored pustules', 'Leaf yellowing', 'Premature leaf fall'],
        ndviThreshold: 0.48,
        ndmiThreshold: 0.38,
        temperatureOptimal: [15, 22],
        moistureOptimal: [75, 90],
        transmissionRisk: 'medium',
        controlMeasures: ['Fungicide application', 'Monitor weather patterns', 'Remove debris', 'Resistant cultivars'],
      },
    ],
    growthStages: [
      {
        stage: 'Vegetative',
        daysFromPlanting: [0, 50],
        ndviRange: [0.3, 0.55],
        criticalIssues: ['Weed competition', 'Soil moisture'],
        waterNeeds: 'low',
      },
      {
        stage: 'Flowering',
        daysFromPlanting: [50, 80],
        ndviRange: [0.55, 0.75],
        criticalIssues: ['Water stress', 'Pest pressure', 'Disease onset'],
        waterNeeds: 'high',
      },
      {
        stage: 'Pod Development',
        daysFromPlanting: [80, 110],
        ndviRange: [0.70, 0.85],
        criticalIssues: ['Seed fill issues', 'Late diseases', 'Nutrient deficiency'],
        waterNeeds: 'high',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [110, 120],
        ndviRange: [0.50, 0.70],
        criticalIssues: ['Weather damage', 'Harvest timing'],
        waterNeeds: 'low',
      },
    ],
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    scientificName: 'Zea mays',
    plantingWindow: [8, 10],
    cycleLength: 120,
    ndviRange: [0.25, 0.90],
    healthyColor: '#16a34a',
    warningColor: '#facc15',
    criticalColor: '#dc2626',
    diseases: [
      {
        disease: 'Gray Leaf Spot',
        description: 'Fungal disease causing rectangular lesions on leaves',
        symptoms: ['Rectangular gray lesions', 'Brown borders', 'Premature leaf death'],
        ndviThreshold: 0.50,
        ndmiThreshold: 0.35,
        temperatureOptimal: [24, 30],
        moistureOptimal: [70, 85],
        transmissionRisk: 'high',
        controlMeasures: ['Crop rotation', 'Fungicide spray', 'Resistant hybrids', 'Tillage management'],
      },
      {
        disease: 'Northern Corn Leaf Blight',
        description: 'Fungal infection causing long narrow lesions',
        symptoms: ['Long narrow lesions', 'Gray-green halo', 'Rapid spread in wet conditions'],
        ndviThreshold: 0.45,
        ndmiThreshold: 0.32,
        temperatureOptimal: [18, 25],
        moistureOptimal: [65, 90],
        transmissionRisk: 'high',
        controlMeasures: ['Fungicide application', 'Resistant varieties', 'Crop rotation', 'Debris removal'],
      },
      {
        disease: 'Southern Rust',
        description: 'Fungal rust specific to southern regions',
        symptoms: ['Small rust pustules', 'Cinnamon color', 'Rapid progression'],
        ndviThreshold: 0.48,
        ndmiThreshold: 0.38,
        temperatureOptimal: [22, 28],
        moistureOptimal: [75, 88],
        transmissionRisk: 'medium',
        controlMeasures: ['Fungicide spraying', 'Monitor weather', 'Resistant hybrids', 'Early planting'],
      },
    ],
    growthStages: [
      {
        stage: 'Germination',
        daysFromPlanting: [0, 20],
        ndviRange: [0.25, 0.40],
        criticalIssues: ['Soil moisture', 'Temperature'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Vegetative Growth',
        daysFromPlanting: [20, 60],
        ndviRange: [0.40, 0.65],
        criticalIssues: ['Weed pressure', 'Nutrient deficiency'],
        waterNeeds: 'high',
      },
      {
        stage: 'Flowering',
        daysFromPlanting: [60, 85],
        ndviRange: [0.65, 0.88],
        criticalIssues: ['Water stress', 'Disease', 'Heat stress'],
        waterNeeds: 'high',
      },
      {
        stage: 'Grain Fill',
        daysFromPlanting: [85, 110],
        ndviRange: [0.70, 0.90],
        criticalIssues: ['Late diseases', 'Insect damage'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [110, 120],
        ndviRange: [0.40, 0.60],
        criticalIssues: ['Weather', 'Harvest timing'],
        waterNeeds: 'low',
      },
    ],
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    plantingWindow: [2, 5],
    cycleLength: 150,
    ndviRange: [0.28, 0.85],
    healthyColor: '#15803d',
    warningColor: '#f59e0b',
    criticalColor: '#d32f2f',
    diseases: [
      {
        disease: 'Septoria Tritici Blotch',
        description: 'Fungal disease causing small dark spots on leaves',
        symptoms: ['Small rectangular spots', 'Dark brown borders', 'Pycnidial fruiting bodies'],
        ndviThreshold: 0.48,
        ndmiThreshold: 0.36,
        temperatureOptimal: [15, 22],
        moistureOptimal: [75, 95],
        transmissionRisk: 'high',
        controlMeasures: ['Fungicide spray', 'Resistant varieties', 'Crop rotation', 'Early sowing'],
      },
      {
        disease: 'Powdery Mildew',
        description: 'White fungal coating reducing photosynthesis',
        symptoms: ['White powder coating', 'Leaf curling'],
        ndviThreshold: 0.50,
        ndmiThreshold: 0.40,
        temperatureOptimal: [15, 20],
        moistureOptimal: [50, 70],
        transmissionRisk: 'medium',
        controlMeasures: ['Sulfur application', 'Fungicide', 'Air circulation'],
      },
      {
        disease: 'Stripe Rust',
        description: 'Yellow and red rust streaks on leaves',
        symptoms: ['Yellow-red streaks', 'Linear pattern', 'Premature death'],
        ndviThreshold: 0.45,
        ndmiThreshold: 0.33,
        temperatureOptimal: [10, 15],
        moistureOptimal: [80, 95],
        transmissionRisk: 'high',
        controlMeasures: ['Fungicide', 'Resistant cultivars', 'Early variety', 'Debris removal'],
      },
    ],
    growthStages: [
      {
        stage: 'Germination',
        daysFromPlanting: [0, 25],
        ndviRange: [0.28, 0.45],
        criticalIssues: ['Soil moisture', 'Cold damage'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Tillering',
        daysFromPlanting: [25, 60],
        ndviRange: [0.45, 0.60],
        criticalIssues: ['Weed competition', 'Disease'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Stem Elongation',
        daysFromPlanting: [60, 90],
        ndviRange: [0.60, 0.75],
        criticalIssues: ['Lodging risk', 'Disease pressure'],
        waterNeeds: 'high',
      },
      {
        stage: 'Heading',
        daysFromPlanting: [90, 110],
        ndviRange: [0.75, 0.85],
        criticalIssues: ['Frost damage', 'Diseases'],
        waterNeeds: 'high',
      },
      {
        stage: 'Grain Fill',
        daysFromPlanting: [110, 135],
        ndviRange: [0.65, 0.80],
        criticalIssues: ['Water stress', 'Heat'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [135, 150],
        ndviRange: [0.35, 0.55],
        criticalIssues: ['Harvest timing'],
        waterNeeds: 'low',
      },
    ],
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    plantingWindow: [11, 2],
    cycleLength: 160,
    ndviRange: [0.25, 0.80],
    healthyColor: '#059669',
    warningColor: '#f97316',
    criticalColor: '#e11d48',
    diseases: [
      {
        disease: 'Bacterial Blight',
        description: 'Bacterial disease causing angular lesions',
        symptoms: ['Angular necrotic lesions', 'Yellow halo', 'Boll rot'],
        ndviThreshold: 0.42,
        ndmiThreshold: 0.30,
        temperatureOptimal: [25, 30],
        moistureOptimal: [70, 90],
        transmissionRisk: 'high',
        controlMeasures: ['Resistant varieties', 'Seed treatment', 'Crop rotation', 'Reduce irrigation'],
      },
      {
        disease: 'Fusarium Wilt',
        description: 'Fungal vascular disease',
        symptoms: ['Wilting', 'Yellowing', 'Root rot', 'Vascular discoloration'],
        ndviThreshold: 0.38,
        ndmiThreshold: 0.25,
        temperatureOptimal: [24, 32],
        moistureOptimal: [60, 75],
        transmissionRisk: 'high',
        controlMeasures: ['Resistant varieties', 'Crop rotation (3+ years)', 'Soil solarization', 'Drainage'],
      },
      {
        disease: 'Alternaria Leaf Spot',
        description: 'Fungal disease causing necrotic lesions',
        symptoms: ['Target-like spots', 'Brown lesions', 'Defoliation'],
        ndviThreshold: 0.45,
        ndmiThreshold: 0.35,
        temperatureOptimal: [20, 28],
        moistureOptimal: [75, 95],
        transmissionRisk: 'medium',
        controlMeasures: ['Fungicide spray', 'Crop rotation', 'Debris removal'],
      },
    ],
    growthStages: [
      {
        stage: 'Germination',
        daysFromPlanting: [0, 30],
        ndviRange: [0.25, 0.42],
        criticalIssues: ['Cold stress', 'Soil moisture'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Vegetative',
        daysFromPlanting: [30, 70],
        ndviRange: [0.42, 0.62],
        criticalIssues: ['Weed pressure', 'Insect damage'],
        waterNeeds: 'high',
      },
      {
        stage: 'Fruiting',
        daysFromPlanting: [70, 120],
        ndviRange: [0.62, 0.80],
        criticalIssues: ['Water stress', 'Disease', 'Boll weevil'],
        waterNeeds: 'high',
      },
      {
        stage: 'Boll Maturation',
        daysFromPlanting: [120, 150],
        ndviRange: [0.50, 0.75],
        criticalIssues: ['Rain damage', 'Late diseases'],
        waterNeeds: 'low',
      },
      {
        stage: 'Harvest Ready',
        daysFromPlanting: [150, 160],
        ndviRange: [0.30, 0.55],
        criticalIssues: ['Weather', 'Timing'],
        waterNeeds: 'low',
      },
    ],
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    scientificName: 'Helianthus annuus',
    plantingWindow: [8, 11],
    cycleLength: 100,
    ndviRange: [0.30, 0.85],
    healthyColor: '#10b981',
    warningColor: '#f59e0b',
    criticalColor: '#dc2626',
    diseases: [
      {
        disease: 'Sclerotinia Head Rot',
        description: 'Fungal disease causing head rot and wilting',
        symptoms: ['Gray mold on head', 'Wilting', 'Black sclerotia'],
        ndviThreshold: 0.50,
        ndmiThreshold: 0.40,
        temperatureOptimal: [15, 22],
        moistureOptimal: [80, 100],
        transmissionRisk: 'high',
        controlMeasures: ['Crop rotation', 'Fungicide', 'Resistance breeding', 'Reduce moisture'],
      },
      {
        disease: 'Downy Mildew',
        description: 'Oomycete pathogen causing yellowing',
        symptoms: ['Yellow spots', 'Downy growth', 'Plant stunting'],
        ndviThreshold: 0.45,
        ndmiThreshold: 0.35,
        temperatureOptimal: [15, 20],
        moistureOptimal: [85, 95],
        transmissionRisk: 'medium',
        controlMeasures: ['Resistant varieties', 'Fungicide', 'Seed treatment'],
      },
    ],
    growthStages: [
      {
        stage: 'Vegetative',
        daysFromPlanting: [0, 40],
        ndviRange: [0.30, 0.55],
        criticalIssues: ['Weed competition'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Heading',
        daysFromPlanting: [40, 65],
        ndviRange: [0.55, 0.80],
        criticalIssues: ['Disease', 'Water stress'],
        waterNeeds: 'high',
      },
      {
        stage: 'Flowering',
        daysFromPlanting: [65, 85],
        ndviRange: [0.70, 0.85],
        criticalIssues: ['Insect damage', 'Disease'],
        waterNeeds: 'high',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [85, 100],
        ndviRange: [0.40, 0.65],
        criticalIssues: ['Bird damage', 'Weather'],
        waterNeeds: 'low',
      },
    ],
  },
  canola: {
    id: 'canola',
    name: 'Canola',
    scientificName: 'Brassica napus',
    plantingWindow: [2, 4],
    cycleLength: 140,
    ndviRange: [0.28, 0.82],
    healthyColor: '#059669',
    warningColor: '#f59e0b',
    criticalColor: '#d32f2f',
    diseases: [
      {
        disease: 'Blackleg',
        description: 'Fungal disease causing stem cankers',
        symptoms: ['Gray stem lesions', 'Premature ripening', 'Stem breakage'],
        ndviThreshold: 0.45,
        ndmiThreshold: 0.34,
        temperatureOptimal: [15, 25],
        moistureOptimal: [70, 85],
        transmissionRisk: 'high',
        controlMeasures: ['Resistant varieties', 'Crop rotation (3+ years)', 'Seed treatment'],
      },
      {
        disease: 'Sclerotinia',
        description: 'Fungal white rot disease',
        symptoms: ['White mold', 'Wilting', 'Stem rot'],
        ndviThreshold: 0.48,
        ndmiThreshold: 0.38,
        temperatureOptimal: [18, 24],
        moistureOptimal: [80, 95],
        transmissionRisk: 'high',
        controlMeasures: ['Fungicide', 'Crop rotation', 'Reduce canopy density'],
      },
    ],
    growthStages: [
      {
        stage: 'Germination',
        daysFromPlanting: [0, 25],
        ndviRange: [0.28, 0.42],
        criticalIssues: ['Soil moisture', 'Temperature'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Rosette',
        daysFromPlanting: [25, 60],
        ndviRange: [0.42, 0.60],
        criticalIssues: ['Disease', 'Slugs'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Stem Elongation',
        daysFromPlanting: [60, 90],
        ndviRange: [0.60, 0.75],
        criticalIssues: ['Lodging', 'Disease'],
        waterNeeds: 'high',
      },
      {
        stage: 'Flowering',
        daysFromPlanting: [90, 120],
        ndviRange: [0.70, 0.82],
        criticalIssues: ['Pollination', 'Weather'],
        waterNeeds: 'high',
      },
      {
        stage: 'Pod Development',
        daysFromPlanting: [120, 135],
        ndviRange: [0.60, 0.75],
        criticalIssues: ['Seed fill', 'Disease'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [135, 140],
        ndviRange: [0.35, 0.55],
        criticalIssues: ['Shattering', 'Weather'],
        waterNeeds: 'low',
      },
    ],
  },
  barley: {
    id: 'barley',
    name: 'Barley',
    scientificName: 'Hordeum vulgare',
    plantingWindow: [2, 5],
    cycleLength: 130,
    ndviRange: [0.30, 0.80],
    healthyColor: '#16a34a',
    warningColor: '#f59e0b',
    criticalColor: '#d32f2f',
    diseases: [
      {
        disease: 'Powdery Mildew',
        description: 'White fungal coating on leaves',
        symptoms: ['White powder', 'Leaf curling'],
        ndviThreshold: 0.50,
        ndmiThreshold: 0.40,
        temperatureOptimal: [15, 20],
        moistureOptimal: [50, 70],
        transmissionRisk: 'medium',
        controlMeasures: ['Fungicide', 'Resistant varieties'],
      },
      {
        disease: 'Scald',
        description: 'Fungal leaf spot disease',
        symptoms: ['Elongated leaf lesions', 'Tan color with dark borders'],
        ndviThreshold: 0.48,
        ndmiThreshold: 0.36,
        temperatureOptimal: [15, 22],
        moistureOptimal: [75, 95],
        transmissionRisk: 'medium',
        controlMeasures: ['Fungicide', 'Resistant cultivars'],
      },
    ],
    growthStages: [
      {
        stage: 'Germination',
        daysFromPlanting: [0, 20],
        ndviRange: [0.30, 0.45],
        criticalIssues: ['Soil moisture'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Tillering',
        daysFromPlanting: [20, 55],
        ndviRange: [0.45, 0.60],
        criticalIssues: ['Weed pressure', 'Disease'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Heading',
        daysFromPlanting: [55, 85],
        ndviRange: [0.60, 0.78],
        criticalIssues: ['Frost damage', 'Disease'],
        waterNeeds: 'high',
      },
      {
        stage: 'Grain Fill',
        daysFromPlanting: [85, 115],
        ndviRange: [0.65, 0.80],
        criticalIssues: ['Water stress', 'Heat'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [115, 130],
        ndviRange: [0.35, 0.55],
        criticalIssues: ['Harvest timing'],
        waterNeeds: 'low',
      },
    ],
  },
  rice: {
    id: 'rice',
    name: 'Rice',
    scientificName: 'Oryza sativa',
    plantingWindow: [5, 8],
    cycleLength: 120,
    ndviRange: [0.35, 0.90],
    healthyColor: '#059669',
    warningColor: '#f59e0b',
    criticalColor: '#d32f2f',
    diseases: [
      {
        disease: 'Blast',
        description: 'Fungal disease affecting leaves, stems, and panicles',
        symptoms: ['Diamond-shaped lesions', 'Gray center with brown border', 'Panicle neck rot'],
        ndviThreshold: 0.50,
        ndmiThreshold: 0.42,
        temperatureOptimal: [20, 28],
        moistureOptimal: [85, 95],
        transmissionRisk: 'high',
        controlMeasures: ['Fungicide', 'Resistant varieties', 'Crop rotation', 'Nutrient management'],
      },
      {
        disease: 'Brown Spot',
        description: 'Fungal leaf spot disease',
        symptoms: ['Brown circular spots', 'Reddish border', 'Leaf blight'],
        ndviThreshold: 0.48,
        ndmiThreshold: 0.38,
        temperatureOptimal: [24, 32],
        moistureOptimal: [75, 95],
        transmissionRisk: 'medium',
        controlMeasures: ['Seed treatment', 'Crop rotation', 'Nutrient balance'],
      },
    ],
    growthStages: [
      {
        stage: 'Germination',
        daysFromPlanting: [0, 25],
        ndviRange: [0.35, 0.50],
        criticalIssues: ['Water management'],
        waterNeeds: 'high',
      },
      {
        stage: 'Tillering',
        daysFromPlanting: [25, 60],
        ndviRange: [0.50, 0.70],
        criticalIssues: ['Disease', 'Nutrient deficiency'],
        waterNeeds: 'high',
      },
      {
        stage: 'Stem Elongation',
        daysFromPlanting: [60, 80],
        ndviRange: [0.70, 0.85],
        criticalIssues: ['Disease pressure', 'Blast risk'],
        waterNeeds: 'high',
      },
      {
        stage: 'Panicle Development',
        daysFromPlanting: [80, 105],
        ndviRange: [0.75, 0.90],
        criticalIssues: ['Blast', 'Water stress'],
        waterNeeds: 'high',
      },
      {
        stage: 'Grain Fill',
        daysFromPlanting: [105, 115],
        ndviRange: [0.70, 0.85],
        criticalIssues: ['Heat', 'Disease'],
        waterNeeds: 'medium',
      },
      {
        stage: 'Maturity',
        daysFromPlanting: [115, 120],
        ndviRange: [0.40, 0.65],
        criticalIssues: ['Harvest timing'],
        waterNeeds: 'low',
      },
    ],
  },
};

export function getCropProfile(cropType: CropType): CropProfile {
  return CROP_PROFILES[cropType];
}

export function getAllCrops(): CropProfile[] {
  return Object.values(CROP_PROFILES);
}

export function getCropDiseases(cropType: CropType): CropDiseaseProfile[] {
  return CROP_PROFILES[cropType].diseases;
}

export function getCropGrowthStage(cropType: CropType, daysFromPlanting: number): CropGrowthStage | null {
  const stages = CROP_PROFILES[cropType].growthStages;
  for (const stage of stages) {
    if (daysFromPlanting >= stage.daysFromPlanting[0] && daysFromPlanting <= stage.daysFromPlanting[1]) {
      return stage;
    }
  }
  return null;
}
