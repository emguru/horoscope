import { dailyReadingNameInstruction, pronounInstructionForPerson } from "./pronoun-prompt";
import type { BirthData, NatalChartData, DailyReading, PronounOption, SynastryReading, TransitCalculationData } from "./types";
import { getTransitCalculation, formatLocalTransitIso } from "./transits";

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

/** Tropical zodiac: (month 1-12, day) when each sign starts */
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

function getSunSignFromDate(month: number, day: number): string {
  for (let i = SUN_SIGN_STARTS.length - 1; i >= 0; i--) {
    const { month: m, day: d, sign } = SUN_SIGN_STARTS[i];
    if (month > m || (month === m && day >= d)) return sign;
  }
  return "Cap";
}

function generateFallbackNatalChart(birthData: BirthData): NatalChartData {
  const [year, month, day] = birthData.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const sunSign = getSunSignFromDate(m, d);
  const signs = ["Cap", "Aqu", "Pis", "Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag"];
  const sunSignIdx = signs.indexOf(sunSign);
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
You are an expert astrologer. DATA-DRIVEN: Every statement MUST reference TRANSIT DATA (transiting planets and transit-to-natal aspects) and natal placements as needed. Use exact sign names (e.g., "Sun in Virgo at 12.7°"). The moving sky drives daily themes. Avoid generic horoscope language. Be concise, 1-3 sentences per section.
`;

export async function fetchReading(
  natalChart: NatalChartData,
  transitData: TransitCalculationData,
  todayDate: string,
  config: ApiConfig,
  pronoun: PronounOption | undefined,
  subjectName?: string
): Promise<DailyReading> {
  if (!config.openaiKey) throw new Error("OpenAI API key required. Add it in Settings.");
  const displayName = (subjectName?.trim() || natalChart.subject?.name?.trim() || "").trim();
  const nameGuide = displayName
    ? dailyReadingNameInstruction(displayName)
    : "No first name was provided: use second-person 'you' for a direct horoscope voice.";
  const pronounGuide = pronounInstructionForPerson("This person", pronoun);
  const system = `${ANALYTICAL_GUIDELINES}

NATAL CHART (birth):
${JSON.stringify(natalChart, null, 2)}

TRANSIT DATA (${todayDate}, source ${transitData.source}):
${JSON.stringify(transitData, null, 2)}

TODAY'S DATE: ${todayDate}

NAME & VOICE: ${nameGuide}
PRONOUN: ${pronounGuide}`;
  const prompt = `Generate a precise daily reading for today (${todayDate}). Lead with transiting planets and transit-to-natal aspects. Every claim must trace to transit data and/or natal placements. ${nameGuide} ${pronounGuide}

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
You are an expert astrologer providing synastry readings. Reference specific placements, aspects, house overlays from BOTH charts. Name exact aspect types (conjunction, square, trine, opposition, sextile). Map Chart A to the first person's name and Chart B to the second—never swap. Be concise, 1-3 sentences per section.
`;

export async function fetchSynastryReading(
  chartA: NatalChartData,
  chartB: NatalChartData,
  todayDate: string,
  config: ApiConfig,
  pronounA: PronounOption | undefined,
  pronounB: PronounOption | undefined,
  transitForA?: TransitCalculationData,
  transitForB?: TransitCalculationData
): Promise<SynastryReading> {
  if (!config.openaiKey) throw new Error("OpenAI API key required. Add it in Settings.");
  const nameA = chartA.subject?.name?.trim() || "Person A";
  const nameB = chartB.subject?.name?.trim() || "Person B";
  const pronounGuide = [
    pronounInstructionForPerson(`${nameA} (Chart A)`, pronounA),
    pronounInstructionForPerson(`${nameB} (Chart B)`, pronounB),
  ].join("\n");
  const nameOutputGuide = `USER-FACING NAMES: Write every section using "${nameA}" and "${nameB}". Do not use "Person A" or "Person B" in the text. Attribute dynamics to each by name.`;
  const getPlacements = (chart: NatalChartData) =>
    (chart.planets ?? []).map((p) => `${p.name} ${p.sign}`).join(", ");
  const placementsA = getPlacements(chartA);
  const placementsB = getPlacements(chartB);
  const transitBlock =
    transitForA && transitForB
      ? `
TRANSITS ${todayDate} — ${nameA}:
${JSON.stringify(transitForA, null, 2)}

TRANSITS ${todayDate} — ${nameB}:
${JSON.stringify(transitForB, null, 2)}
`
      : "";
  const system = `${SYNANSTRY_GUIDELINES}

CRITICAL: "${nameA}" = CHART A only. "${nameB}" = CHART B only. Never swap.

${nameA} (Chart A) placements: ${placementsA}
${nameB} (Chart B) placements: ${placementsB}

CHART A — ${nameA} (natal):
${JSON.stringify(chartA, null, 2)}

CHART B — ${nameB} (natal):
${JSON.stringify(chartB, null, 2)}
${transitBlock}
TODAY: ${todayDate}

${nameOutputGuide}
PRONOUNS: ${pronounGuide}`;
  const prompt = `Generate a synastry reading for ${nameA} and ${nameB}. ${nameOutputGuide} Analyze planetary interactions (aspects, house overlays). Include relationship dynamics, communication, emotional connection, strengths, growth areas. Add dailyRelationshipAdvice and dailyComparison — use transits when present. Reference planetary pairs and use names in the prose.

Return JSON with: summary, strengths (array of 3), challenges (array of 2), communication, emotionalConnection, advice, dailyRelationshipAdvice, dailyComparison.`;
  const obj = (await callOpenAI(config.openaiKey, system, prompt)) as SynastryReading;
  return {
    summary: obj.summary ?? "",
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    challenges: Array.isArray(obj.challenges) ? obj.challenges : [],
    communication: obj.communication ?? "",
    emotionalConnection: obj.emotionalConnection ?? "",
    advice: obj.advice ?? "",
    dailyRelationshipAdvice: obj.dailyRelationshipAdvice ?? "",
    dailyComparison: obj.dailyComparison ?? "",
  };
}
