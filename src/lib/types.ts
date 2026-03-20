export interface BirthData {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
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

export interface DailyReading {
  summary: string;
  planetaryHighlights: string[];
  houseFocus: string;
  advice: string;
  keyAspects: string[];
}
