export type PronounOption = "he" | "she" | "they" | "prefer-not-to-say";

export interface BirthData {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  location: string;
  lat?: number;
  lng?: number;
  name?: string;
}

/** Stored birth data (persisted in Settings) */
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
  /** Ecliptic longitude 0–360° when available */
  abs_pos?: number;
}

export interface NatalChartData {
  subject?: { name?: string; city?: string };
  planets: PlanetPosition[];
  houses?: { number: number; sign: string; degree: number }[];
  cusps?: { house: number; longitude: number }[];
  aspects_summary?: {
    total: number;
    major: number;
    by_type: Record<string, number>;
  };
  aspects?: Array<{
    planet1: string;
    planet2: string;
    type: string;
    orb: number;
  }>;
}

/** Transit-to-natal aspect row (Swiss Ephemeris API or astronomy-engine fallback) */
export interface TransitToNatalAspect {
  transit_body: string;
  natal_body: string;
  aspect_type: string;
  orb_degrees: number;
  /** Human-readable, when available */
  description?: string;
  is_applying?: boolean;
}

/** Current sky vs natal — changes day to day */
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
  /** When you may have good days together (daily compatibility) */
  goodDaysTogether?: string;
  /** When you may have off days or need space */
  offDays?: string;
  /** Comparison/contrast of your daily energies today */
  dailyComparison?: string;
}
