import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { NatalChartData } from "@/lib/types";

const readingSchema = z.object({
  summary: z.string().describe("2-3 sentence overview of today's astrological energy for this chart"),
  planetaryHighlights: z.array(z.string()).length(3).describe("Three specific planetary influences active today"),
  houseFocus: z.string().describe("Which house is most activated today and why"),
  advice: z.string().describe("One concrete, actionable piece of advice"),
  keyAspects: z.array(z.string()).length(2).describe("Two key aspects affecting the native today"),
});

const ANALYTICAL_GUIDELINES = `
You are an expert astrologer providing daily readings. Follow these STRICT guidelines:

1. DATA-DRIVEN: Every statement MUST reference specific data from the natal chart provided (planetary positions, signs, houses, aspects). Never make generic statements.

2. PRECISION: Use exact sign names (e.g., "Sun in Virgo at 12.7°"), house numbers, and aspect types. Avoid vague language like "you might feel" without astrological basis.

3. SYNTHESIS: Connect natal chart placements to today's date. Consider transiting planets relative to natal positions. Today's date is provided for transit context.

4. AVOID: Generic horoscope language, fortune-cookie advice, or statements that could apply to anyone. No "you may experience" without naming the astrological cause.

5. TONE: Professional, insightful, and specific. Write as a practicing astrologer would for a client consultation.

6. LENGTH: Be concise. Each section should be 1-3 sentences. Quality over quantity.
`;

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it to .env.local" },
      { status: 503 }
    );
  }

  try {
    const { natalChart, todayDate } = (await request.json()) as {
      natalChart: NatalChartData;
      todayDate: string;
    };

    if (!natalChart?.planets?.length) {
      return NextResponse.json(
        { error: "Valid natal chart data required" },
        { status: 400 }
      );
    }

    const chartContext = `
NATAL CHART DATA (use this exact data - do not invent positions):
${JSON.stringify(natalChart, null, 2)}

TODAY'S DATE: ${todayDate}
`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: readingSchema,
      system: `${ANALYTICAL_GUIDELINES}\n\n${chartContext}`,
      prompt: `Generate a precise daily astrological reading for today (${todayDate}) based exclusively on the natal chart data above. Every claim must trace back to a specific placement, house, or aspect in the chart.`,
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
