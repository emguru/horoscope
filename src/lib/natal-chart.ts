import type { BirthData, NatalChartData } from "./types";

const FREE_ASTRO_API_URL = "https://api.freeastroapi.com/api/v1/natal/calculate";

/**
 * Fetch natal chart from FreeAstroAPI
 * Uses apiKey param, or FREE_ASTRO_API_KEY from env (free tier: 80 req/day)
 */
export async function fetchNatalChart(
  birthData: BirthData,
  apiKeyOverride?: string
): Promise<NatalChartData | null> {
  const apiKey = apiKeyOverride || process.env.FREE_ASTRO_API_KEY;
  if (!apiKey) {
    console.warn("FREE_ASTRO_API_KEY not set - using fallback");
    return generateFallbackNatalChart(birthData);
  }

  const [year, month, day] = birthData.date.split("-").map(Number);
  const [hour, minute] = birthData.time.split(":").map(Number);

  const body = {
    name: birthData.name?.trim() || "User",
    year,
    month,
    day,
    hour: hour ?? 12,
    minute: minute ?? 0,
    city: birthData.location,
    lat: birthData.lat,
    lng: birthData.lng,
    tz_str: "AUTO",
  };

  try {
    const res = await fetch(FREE_ASTRO_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("FreeAstroAPI error:", res.status, err);
      return generateFallbackNatalChart(birthData);
    }

    return (await res.json()) as NatalChartData;
  } catch (err) {
    console.error("Natal chart fetch failed:", err);
    return generateFallbackNatalChart(birthData);
  }
}

/** Tropical zodiac: (month 1-12, day) when each sign starts. Capricorn wraps Dec→Jan. */
const SUN_SIGN_STARTS: { month: number; day: number; sign: string }[] = [
  { month: 1, day: 20, sign: "Aqu" },
  { month: 2, day: 19, sign: "Pis" },
  { month: 3, day: 21, sign: "Ari" },
  { month: 4, day: 20, sign: "Tau" },
  { month: 5, day: 21, sign: "Gem" },
  { month: 6, day: 21, sign: "Can" },
  { month: 7, day: 23, sign: "Leo" },
  { month: 8, day: 23, sign: "Vir" },
  { month: 9, day: 23, sign: "Lib" },
  { month: 10, day: 23, sign: "Sco" },
  { month: 11, day: 22, sign: "Sag" },
  { month: 12, day: 22, sign: "Cap" },
];

/** Tropical Sun sign abbreviation (Ari, Tau, …) from calendar month/day */
export function getTropicalSunSignAbbrev(month: number, day: number): string {
  for (let i = SUN_SIGN_STARTS.length - 1; i >= 0; i--) {
    const { month: m, day: d, sign } = SUN_SIGN_STARTS[i];
    if (month > m || (month === m && day >= d)) return sign;
  }
  return "Cap";
}

/**
 * Fallback: generate approximate natal chart when API is unavailable
 * Uses tropical zodiac boundaries for sun sign (simplified; full chart needs ephemeris)
 */
function generateFallbackNatalChart(birthData: BirthData): NatalChartData {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const sunSign = getTropicalSunSignAbbrev(m, d);
  const signs = [
    "Cap", "Aqu", "Pis", "Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag"
  ];
  const sunSignIdx = signs.indexOf(sunSign);

  // Placeholder positions - in production, use Swiss Ephemeris or similar
  const planets = [
    { name: "Sun", sign: sunSign, pos: 15, house: 1 },
    { name: "Moon", sign: signs[(sunSignIdx + 1) % 12], pos: 8, house: 2 },
    { name: "Mercury", sign: sunSign, pos: 12, house: 1 },
    { name: "Venus", sign: signs[(sunSignIdx + 2) % 12], pos: 22, house: 2 },
    { name: "Mars", sign: signs[(sunSignIdx + 3) % 12], pos: 5, house: 3 },
    { name: "Jupiter", sign: signs[(sunSignIdx + 4) % 12], pos: 18, house: 4 },
    { name: "Saturn", sign: signs[(sunSignIdx + 5) % 12], pos: 3, house: 5 },
    { name: "Uranus", sign: signs[(sunSignIdx + 6) % 12], pos: 14, house: 6 },
    { name: "Neptune", sign: signs[(sunSignIdx + 7) % 12], pos: 9, house: 7 },
    { name: "Pluto", sign: signs[(sunSignIdx + 8) % 12], pos: 21, house: 8 },
  ];

  return {
    subject: { name: birthData.name?.trim() || "User", city: birthData.location },
    planets,
    aspects_summary: {
      total: 12,
      major: 12,
      by_type: { Conjunction: 3, Trine: 2, Square: 2, Opposition: 1 },
    },
  };
}
