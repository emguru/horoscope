import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { pronounInstructionForPerson } from "@/lib/pronoun-prompt";
import type { NatalChartData, PronounOption, TransitCalculationData } from "@/lib/types";

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

1. DATA-DRIVEN: Every statement MUST reference specific placements, aspects, or house overlays from BOTH natal charts. Internally map Chart A to the first person's name and Chart B to the second person's name—never swap charts.

2. PRECISION: Name exact aspect types (conjunction, square, trine, opposition, sextile), which planets, and in what signs. Reference house overlays when relevant.

3. SYNTHESIS: Connect how Person A's chart interacts with Person B's chart. Consider: Sun-Moon connections, Venus-Mars (romantic compatibility), Mercury (communication), Saturn (structure/challenges). When TRANSIT DATA is provided, use it for today's relational timing (each person's transits to their own natal chart).

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
    const { chartA, chartB, todayDate, pronounA, pronounB, transitForA, transitForB } = (await request.json()) as {
      chartA: NatalChartData;
      chartB: NatalChartData;
      todayDate: string;
      pronounA?: PronounOption;
      pronounB?: PronounOption;
      transitForA?: TransitCalculationData;
      transitForB?: TransitCalculationData;
    };

    if (!chartA?.planets?.length || !chartB?.planets?.length) {
      return NextResponse.json(
        { error: "Both natal charts required" },
        { status: 400 }
      );
    }

    const nameA = (chartA.subject as { name?: string })?.name?.trim() || "Person A";
    const nameB = (chartB.subject as { name?: string })?.name?.trim() || "Person B";

    const pronounGuide = [
      pronounInstructionForPerson(`${nameA} (Chart A)`, pronounA),
      pronounInstructionForPerson(`${nameB} (Chart B)`, pronounB),
    ].join("\n");

    const nameOutputGuide = `USER-FACING NAMES: Write every section using the names "${nameA}" and "${nameB}". Do not use the labels "Person A" or "Person B" in the text shown to the reader. When describing dynamics, attribute behaviors and feelings to "${nameA}" or "${nameB}" by name.`;

    // Extract key placements so AI never confuses whose chart is whose
    const getPlacements = (chart: NatalChartData) =>
      (chart.planets ?? [])
        .map((p) => `${p.name} ${p.sign}`)
        .join(", ");
    const placementsA = getPlacements(chartA);
    const placementsB = getPlacements(chartB);

    const transitBlock =
      transitForA && transitForB
        ? `
TRANSITS FOR ${todayDate} — ${nameA}:
${JSON.stringify(transitForA, null, 2)}

TRANSITS FOR ${todayDate} — ${nameB}:
${JSON.stringify(transitForB, null, 2)}
`
        : "";

    const chartContext = `
CRITICAL - USE EXACT DATA: "${nameA}" corresponds ONLY to CHART A below. "${nameB}" corresponds ONLY to CHART B. Never swap them.

${nameA} (Chart A) placements: ${placementsA}
${nameB} (Chart B) placements: ${placementsB}

CHART A — ${nameA} (natal):
${JSON.stringify(chartA, null, 2)}

CHART B — ${nameB} (natal):
${JSON.stringify(chartB, null, 2)}
${transitBlock}
TODAY'S DATE: ${todayDate}

${nameOutputGuide}

PRONOUN GUIDE: ${pronounGuide}
`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: synastrySchema,
      system: `${SYNANSTRY_GUIDELINES}\n\n${chartContext}`,
      prompt: `Generate a synastry reading for ${nameA} and ${nameB}. ${nameOutputGuide} Analyze how their planets interact (aspects, house overlays). Include: relationship dynamics, communication, emotional connection, strengths, growth areas. Also add daily compatibility: goodDaysTogether, offDays, dailyComparison — if TRANSIT DATA is present, ground these sections in each person's transiting planets and transit-to-natal aspects for today; otherwise use synastry between natal charts. Reference specific planetary pairs and the individuals by name.`,
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
