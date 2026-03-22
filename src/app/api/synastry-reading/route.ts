import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { NatalChartData, PronounOption } from "@/lib/types";

const synastrySchema = z.object({
  summary: z.string().describe("2-3 sentence overview of how these two charts interact"),
  strengths: z.array(z.string()).length(3).describe("Three key relationship strengths based on chart synastry"),
  challenges: z.array(z.string()).length(2).describe("Two potential challenges or growth areas"),
  communication: z.string().describe("How they communicate and exchange ideas"),
  emotionalConnection: z.string().describe("Emotional and intimate connection"),
  advice: z.string().describe("One actionable piece of relationship advice"),
  goodDaysTogether: z.string().describe("When this couple may have good days together—aligning energies, supportive transits, harmonious aspects. Be specific about what creates these favorable moments."),
  offDays: z.string().describe("When they may have off days or need space—contrasting energies, challenging transits, conflicting planetary influences. Be specific about causes."),
  dailyComparison: z.string().describe("Comparison and contrast of their daily energies for today: how their individual transits interact, where they align vs. differ."),
});

const SYNANSTRY_GUIDELINES = `
You are an expert astrologer providing synastry (relationship compatibility) readings. Follow these STRICT guidelines:

1. DATA-DRIVEN: Every statement MUST reference specific placements, aspects, or house overlays from BOTH natal charts. Compare Person A's planets to Person B's planets.

2. PRECISION: Name exact aspect types (conjunction, square, trine, opposition, sextile), which planets, and in what signs. Reference house overlays when relevant.

3. SYNTHESIS: Connect how Person A's chart interacts with Person B's chart. Consider: Sun-Moon connections, Venus-Mars (romantic compatibility), Mercury (communication), Saturn (structure/challenges).

4. AVOID: Generic compatibility language. No "you might feel" without naming the astrological cause. Be specific about WHICH planets create the dynamic.

5. TONE: Professional, insightful, balanced. Acknowledge both strengths and growth areas.

6. LENGTH: Be concise. Each section 1-3 sentences.
`;

export async function POST(request: NextRequest) {
  const headerKey = request.headers.get("x-openai-api-key");
  const apiKey = headerKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key required. Add in Settings or .env.local" },
      { status: 503 }
    );
  }

  const openai = createOpenAI({ apiKey });

  try {
    const { chartA, chartB, todayDate, pronounA, pronounB } = (await request.json()) as {
      chartA: NatalChartData;
      chartB: NatalChartData;
      todayDate: string;
      pronounA?: PronounOption;
      pronounB?: PronounOption;
    };

    if (!chartA?.planets?.length || !chartB?.planets?.length) {
      return NextResponse.json(
        { error: "Both natal charts required" },
        { status: 400 }
      );
    }

    const pronounGuide =
      pronounA && pronounA !== "prefer-not-to-say" && pronounB && pronounB !== "prefer-not-to-say"
        ? `Person A: use ${pronounA} (${pronounA === "he" ? "he/him/his" : pronounA === "she" ? "she/her/hers" : "they/them/theirs"}). Person B: use ${pronounB} (${pronounB === "he" ? "he/him/his" : pronounB === "she" ? "she/her/hers" : "they/them/theirs"}).`
        : "Use 'Person A' and 'Person B' or neutral language when referring to each person.";

    const nameA = (chartA.subject as { name?: string })?.name || "Person A";
    const nameB = (chartB.subject as { name?: string })?.name || "Person B";

    // Extract key placements so AI never confuses whose chart is whose
    const getPlacements = (chart: NatalChartData) =>
      (chart.planets ?? [])
        .map((p) => `${p.name} ${p.sign}`)
        .join(", ");
    const placementsA = getPlacements(chartA);
    const placementsB = getPlacements(chartB);

    const chartContext = `
CRITICAL - USE EXACT DATA: When you mention "${nameA}" or "Person A", use ONLY the placements from CHART A below. When you mention "${nameB}" or "Person B", use ONLY the placements from CHART B. Never swap them.

${nameA} (Person A / Chart A) placements: ${placementsA}
${nameB} (Person B / Chart B) placements: ${placementsB}

PERSON A (${nameA}) FULL NATAL CHART:
${JSON.stringify(chartA, null, 2)}

PERSON B (${nameB}) FULL NATAL CHART:
${JSON.stringify(chartB, null, 2)}

TODAY'S DATE: ${todayDate}

PRONOUN GUIDE: ${pronounGuide}
`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: synastrySchema,
      system: `${SYNANSTRY_GUIDELINES}\n\n${chartContext}`,
      prompt: `Generate a synastry reading comparing these two natal charts (${nameA} and ${nameB}). Analyze how their planets interact (aspects, house overlays). Include: relationship dynamics, communication, emotional connection, strengths, growth areas. Also add daily compatibility: goodDaysTogether (when they may have good days together today), offDays (when they may have off days or need space), dailyComparison (compare/contrast their individual daily energies and how they interact). Reference specific planetary pairs.`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Synastry reading failed:", err);
    return NextResponse.json(
      { error: "Failed to generate synastry reading" },
      { status: 500 }
    );
  }
}
