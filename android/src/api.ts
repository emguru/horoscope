import type { BirthData, NatalChartData, DailyReading, SynastryReading } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const FREE_ASTRO_URL = "https://api.freeastroapi.com/api/v1/natal/calculate";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface ApiConfig {
  openaiKey: string;
  freeAstroKey?: string;
}

/** Geocode via Nominatim - no API key, works on WiFi or mobile data */
export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(location.trim())}&format=json&limit=1`,
      { headers: { "User-Agent": "HoroscopeApp/1.0" } }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function generateFallbackNatalChart(birthData: BirthData): NatalChartData {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const sunSignIndex = Math.floor(((date.getMonth() * 30 + date.getDate() - 20) % 365) / 30.4);
  const signs = ["Cap", "Aqu", "Pis", "Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag"];
  const sunSign = signs[(sunSignIndex + 12) % 12];
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
    aspects_summary: { total: 12, major: 12, by_type: { Conjunction: 3, Trine: 2, Square: 2, Opposition: 1 } },
  };
}

export async function fetchNatalChart(
  birthData: BirthData,
  config: ApiConfig
): Promise<NatalChartData> {
  if (config.freeAstroKey) {
    try {
      const [year, month, day] = birthData.date.split("-").map(Number);
      const [hour, minute] = birthData.time.split(":").map(Number);
      const res = await fetch(FREE_ASTRO_URL, {
        method: "POST",
        headers: {
          "x-api-key": config.freeAstroKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      });
      if (res.ok) return (await res.json()) as NatalChartData;
    } catch {
      // fall through to fallback
    }
  }
  return generateFallbackNatalChart(birthData);
}

async function callOpenAI(apiKey: string, system: string, prompt: string): Promise<unknown> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  if (data.error) throw new Error(data.error.message || "OpenAI API error");
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  return JSON.parse(content) as unknown;
}

const ANALYTICAL_GUIDELINES = `
You are an expert astrologer. DATA-DRIVEN: Every statement MUST reference specific data from the natal chart (planetary positions, signs, houses, aspects). Use exact sign names (e.g., "Sun in Virgo at 12.7°"). Connect natal chart placements to today's date. Avoid generic horoscope language. Be concise, 1-3 sentences per section.
`;

export async function fetchReading(
  natalChart: NatalChartData,
  todayDate: string,
  config: ApiConfig,
  pronoun?: string
): Promise<DailyReading> {
  if (!config.openaiKey) throw new Error("OpenAI API key required. Add it in Settings.");
  const pronounGuide =
    pronoun && pronoun !== "prefer-not-to-say"
      ? `Use "${pronoun}" pronouns (${pronoun === "he" ? "he/him/his" : pronoun === "she" ? "she/her/hers" : "they/them/theirs"}).`
      : "Use neutral language or 'the native'.";
  const system = `${ANALYTICAL_GUIDELINES}

NATAL CHART DATA:
${JSON.stringify(natalChart, null, 2)}

TODAY'S DATE: ${todayDate}
PRONOUN: ${pronounGuide}`;
  const prompt = `Generate a precise daily astrological reading for today (${todayDate}) based on the natal chart. Every claim must trace to a specific placement, house, or aspect. ${pronounGuide}

Return JSON with: summary (string), planetaryHighlights (array of 3 strings), houseFocus (string), advice (string), keyAspects (array of 2 strings).`;
  const obj = (await callOpenAI(config.openaiKey, system, prompt)) as DailyReading;
  return {
    summary: obj.summary ?? "",
    planetaryHighlights: Array.isArray(obj.planetaryHighlights) ? obj.planetaryHighlights : [],
    houseFocus: obj.houseFocus ?? "",
    advice: obj.advice ?? "",
    keyAspects: Array.isArray(obj.keyAspects) ? obj.keyAspects : [],
  };
}

const SYNANSTRY_GUIDELINES = `
You are an expert astrologer providing synastry readings. Reference specific placements, aspects, house overlays from BOTH charts. Name exact aspect types (conjunction, square, trine, opposition, sextile). Connect Person A's chart to Person B's. Be specific about which planets create each dynamic. Be concise, 1-3 sentences per section.
`;

export async function fetchSynastryReading(
  chartA: NatalChartData,
  chartB: NatalChartData,
  todayDate: string,
  config: ApiConfig,
  pronounA?: string,
  pronounB?: string
): Promise<SynastryReading> {
  if (!config.openaiKey) throw new Error("OpenAI API key required. Add it in Settings.");
  const pronounGuide =
    pronounA && pronounA !== "prefer-not-to-say" && pronounB && pronounB !== "prefer-not-to-say"
      ? `Person A: ${pronounA}. Person B: ${pronounB}.`
      : "Use 'Person A' and 'Person B'.";
  const system = `${SYNANSTRY_GUIDELINES}

PERSON A NATAL CHART:
${JSON.stringify(chartA, null, 2)}

PERSON B NATAL CHART:
${JSON.stringify(chartB, null, 2)}

TODAY: ${todayDate}
PRONOUNS: ${pronounGuide}`;
  const prompt = `Generate a synastry reading comparing these two natal charts. Analyze planetary interactions (aspects, house overlays). Focus on communication, emotional connection, strengths, and growth areas. Reference specific planetary pairs.

Return JSON with: summary (string), strengths (array of 3 strings), challenges (array of 2 strings), communication (string), emotionalConnection (string), advice (string).`;
  const obj = (await callOpenAI(config.openaiKey, system, prompt)) as SynastryReading;
  return {
    summary: obj.summary ?? "",
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    challenges: Array.isArray(obj.challenges) ? obj.challenges : [],
    communication: obj.communication ?? "",
    emotionalConnection: obj.emotionalConnection ?? "",
    advice: obj.advice ?? "",
  };
}
