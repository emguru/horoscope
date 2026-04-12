export type PronounOption = "he" | "she" | "they" | "prefer-not-to-say";

export interface BirthData {
  date: string;
  time: string;
  location: string;
  lat?: number;
  lng?: number;
  name?: string;
}

export interface StoredBirthData {
  name: string;
  date: string;
  time: string;
  location: string;
  lat?: number;
  lng?: number;
}

export interface PlanetPosition {
  name: string;
  sign: string;
  pos: number;
  house?: number;
  retrograde?: boolean;
  abs_pos?: number;
}

export interface TransitToNatalAspect {
  transit_body: string;
  natal_body: string;
  aspect_type: string;
  orb_degrees: number;
  description?: string;
  is_applying?: boolean;
}

export interface TransitCalculationData {
  source: "api" | "fallback";
  transit_date: string;
  transit_time?: string;
  location_note?: string;
  transit_planets: PlanetPosition[];
  transit_to_natal_aspects: TransitToNatalAspect[];
  aspects_summary?: {
    total: number;
    major: number;
    by_type: Record<string, number>;
  };
}

export interface NatalChartData {
  subject?: { name?: string; city?: string };
  planets: PlanetPosition[];
  houses?: { number: number; sign: string; degree: number }[];
  aspects_summary?: {
    total: number;
    major: number;
    by_type: Record<string, number>;
  };
}

export interface DailyReading {
  summary: string;
  planetaryHighlights: string[];
  houseFocus: string;
  advice: string;
  keyAspects: string[];
}

export interface SynastryReading {
  summary: string;
  strengths: string[];
  challenges: string[];
  communication: string;
  emotionalConnection: string;
  advice: string;
  /** Relationship advice for today based on planetary aspects */
  dailyRelationshipAdvice?: string;
  dailyComparison?: string;
}
