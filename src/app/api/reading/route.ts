import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { dailyReadingNameInstruction, pronounInstructionForPerson } from "@/lib/pronoun-prompt";
import type { NatalChartData, PronounOption, TransitCalculationData } from "@/lib/types";

const readingSchema = z.object({
  summary: z.string().describe("2-3 sentence overview of today's astrological energy for this chart"),
  planetaryHighlights: z.array(z.string()).length(3).describe("Three specific planetary influences active today"),
  houseFocus: z.string().describe("Which house is most activated today and why"),
  advice: z.string().describe("One concrete, actionable piece of advice"),
  keyAspects: z.array(z.string()).length(2).describe("Two key transit-to-natal aspects affecting this person today (use their name, not 'the native')"),
});

const ANALYTICAL_GUIDELINES = `
You are an expert astrologer providing daily readings. Follow these STRICT guidelines:

1. DATA-DRIVEN: Every statement MUST reference specific data from the TRANSIT DATA (transiting planets and transit-to-natal aspects) and, where relevant, the natal chart. Never make generic statements.

2. PRECISION: Use exact sign names (e.g., "Sun in Virgo at 12.7°"), house numbers when given, and aspect types. Avoid vague language like "you might feel" without astrological basis.

3. SYNTHESIS: The TRANSIT DATA is what changes day to day—prioritize transiting positions and aspects to natal placements. Natal data is fixed context; the moving sky drives today's themes.

4. AVOID: Generic horoscope language, fortune-cookie advice, or statements that could apply to anyone. No "you may experience" without naming the astrological cause.

5. TONE: Professional, insightful, and specific. Write as a practicing astrologer would for a client consultation.

6. LENGTH: Be concise. Each section should be 1-3 sentences. Quality over quantity.
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
    const { natalChart, transitData, todayDate, pronoun, subjectName } = (await request.json()) as {
      natalChart: NatalChartData;
      transitData: TransitCalculationData;
      todayDate: string;
      pronoun?: PronounOption;
      /** Preferred display name; falls back to natal chart subject name */
      subjectName?: string;
    };

    if (!natalChart?.planets?.length) {
      return NextResponse.json(
        { error: "Valid natal chart data required" },
        { status: 400 }
      );
    }
    if (!transitData?.transit_planets?.length || !transitData?.transit_to_natal_aspects) {
      return NextResponse.json(
        { error: "Transit data required (transit_planets and transit_to_natal_aspects)" },
        { status: 400 }
      );
    }

    const displayName =
      (subjectName?.trim() || natalChart.subject?.name?.trim() || "").trim() || null;

    const pronounGuide = pronounInstructionForPerson("This person", pronoun);
    const nameGuide = displayName
      ? dailyReadingNameInstruction(displayName)
      : "No first name was provided: use second-person 'you' for a direct horoscope voice.";

    const chartContext = `
NATAL CHART (birth — fixed reference; do not invent positions):
${JSON.stringify(natalChart, null, 2)}

TRANSIT DATA FOR ${todayDate} (source: ${transitData.source} — this is the changing sky and transit-to-natal geometry):
${JSON.stringify(transitData, null, 2)}

TODAY'S DATE: ${todayDate}

NAME & VOICE: ${nameGuide}

PRONOUN GUIDELINE: ${pronounGuide}
`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: readingSchema,
      system: `${ANALYTICAL_GUIDELINES}\n\n${chartContext}`,
      prompt: `Generate a precise daily astrological reading for today (${todayDate}). Lead with transiting planets and transit-to-natal aspects from TRANSIT DATA. Every claim must trace to transit data and/or a specific natal placement it activates. ${nameGuide} ${pronounGuide}`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Reading generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate reading" },
      { status: 500 }
    );
  }
}
