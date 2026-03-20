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
    name: "User",
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

/**
 * Fallback: generate approximate natal chart when API is unavailable
 * Uses simplified calculations based on birth date (less precise without exact ephemeris)
 */
function generateFallbackNatalChart(birthData: BirthData): NatalChartData {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Approximate Sun sign from date (simplified - real calculation needs ephemeris)
  const sunSignIndex = Math.floor(
    ((date.getMonth() * 30 + date.getDate() - 20) % 365) / 30.4
  );
  const signs = [
    "Cap", "Aqu", "Pis", "Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag"
  ];
  const sunSign = signs[(sunSignIndex + 12) % 12];

  // Placeholder positions - in production, use Swiss Ephemeris or similar
  const planets = [
    { name: "Sun", sign: sunSign, pos: 15, house: 1 },
    { name: "Moon", sign: signs[(sunSignIndex + 1) % 12], pos: 8, house: 2 },
    { name: "Mercury", sign: sunSign, pos: 12, house: 1 },
    { name: "Venus", sign: signs[(sunSignIndex + 2) % 12], pos: 22, house: 2 },
    { name: "Mars", sign: signs[(sunSignIndex + 3) % 12], pos: 5, house: 3 },
    { name: "Jupiter", sign: signs[(sunSignIndex + 4) % 12], pos: 18, house: 4 },
    { name: "Saturn", sign: signs[(sunSignIndex + 5) % 12], pos: 3, house: 5 },
    { name: "Uranus", sign: signs[(sunSignIndex + 6) % 12], pos: 14, house: 6 },
    { name: "Neptune", sign: signs[(sunSignIndex + 7) % 12], pos: 9, house: 7 },
    { name: "Pluto", sign: signs[(sunSignIndex + 8) % 12], pos: 21, house: 8 },
  ];

  return {
    subject: { name: "User", city: birthData.location },
    planets,
    aspects_summary: {
      total: 12,
      major: 12,
      by_type: { Conjunction: 3, Trine: 2, Square: 2, Opposition: 1 },
    },
  };
}
