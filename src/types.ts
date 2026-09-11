export interface ScoreAnalysis {
  score: number;
  max_score: number;
  status_text: string;
  credit_status: string;
}

export interface YieldPrediction {
  current_yield: number;
  max_yield: number;
  unit: string;
}

export interface Financials {
  potential_extra_profit_bdt: number;
  formatted_extra_profit: string;
}

export interface AIRecommendation {
  category: string;
  title: string;
  action: string;
}

export interface DailyTask {
  task: string;
  recommended: boolean;
}

export interface AdvisorResponse {
  score_analysis: ScoreAnalysis;
  yield_prediction: YieldPrediction;
  financials: Financials;
  ai_recommendations: AIRecommendation[];
  daily_tasks: DailyTask[];
  alerts: string[];
}

export interface AdvisorRequest {
  cropType: string;
  cropVariety?: string;
  season?: string;
  landSize: number;
  landUnit: 'বিঘা' | 'একর' | 'শতাংশ';
  soilType: string;
  soilTestDate?: string;
  soilTestSummary?: string;
  sowingDate?: string;
  seedQuantity?: number;
  seedUnit?: string;
  irrigationStatus?: string;
  cropStage?: string;
  region: string;
  notes?: string;
  inputsUsed?: Array<{
    category: string;
    name: string;
    quantity: number;
    unit: string;
    price?: number;
  }>;
}

export interface CropInfo {
  id: string;
  name: string;
  nameEn?: string;
  scientificName: string;
  image: string;
  category?: 'দানা ফসল' | 'সবজি' | 'ফল ও অর্থকরী' | 'তৈলবীজ ও মসলা';
  categoryEn?: string;
  seasonTag?: string;
  seasonTagEn?: string;
  suitableSeason: string;
  suitableSeasonEn?: string;
  soilType: string;
  soilTypeEn?: string;
  seedRate: string;
  seedRateEn?: string;
  fertilizerGuide: string;
  fertilizerGuideEn?: string;
  irrigationGuide: string;
  irrigationGuideEn?: string;
  commonPests: string[];
  commonPestsEn?: string[];
  commonDiseases: string[];
  commonDiseasesEn?: string[];
  harvestingTime: string;
  harvestingTimeEn?: string;
  preservation: string;
  preservationEn?: string;
}

export interface MarketPriceItem {
  id: string;
  name: string;
  nameEn?: string;
  category: 'ধান' | 'গম' | 'সবজি' | 'ফল' | 'মসলা';
  categoryEn?: string;
  price: number;
  unit: string;
  unitEn?: string;
  location: string;
  locationEn?: string;
  change: 'up' | 'down' | 'stable';
  changePercentage: number;
  image: string;
  updatedAt: string;
  updatedAtEn?: string;
}

export interface WeatherDay {
  dayName: string;
  date: string;
  temp: number;
  condition: string;
  humidity: number;
  rainProbability: number;
  warning?: string;
}

export interface CropDisease {
  id: string;
  crop: string;
  cropEn?: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  symptoms: string[];
  symptomsEn?: string[];
  organicSolution: string;
  organicSolutionEn?: string;
  chemicalSolution: {
    chemical: string;
    usage: string;
    usageEn?: string;
    dose: string;
    doseEn?: string;
  };
  prevention: string;
  preventionEn?: string;
  image: string;
}

export interface InputItem {
  id: string;
  category: 'বীজ' | 'সার' | 'কীটনাশক' | 'ছত্রাকনাশক' | 'অন্যান্য';
  name: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
  selected?: boolean;
}

export interface SavedInputExpense {
  id: string;
  farmerPhone?: string;
  farmerName?: string;
  title: string;
  totalAmount: number;
  itemCount: number;
  items: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  categorySummary?: string;
  date: string;
  timestamp?: number;
  createdAt?: any;
}

