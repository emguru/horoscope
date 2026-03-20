import { NextRequest, NextResponse } from "next/server";
import { fetchNatalChart } from "@/lib/natal-chart";
import type { BirthData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const birthData = (await request.json()) as BirthData;

    if (!birthData.date || !birthData.time || !birthData.location) {
      return NextResponse.json(
        { error: "Birth date, time, and location are required" },
        { status: 400 }
      );
    }

    const apiKey = request.headers.get("x-free-astro-api-key") || undefined;
    const chart = await fetchNatalChart(birthData, apiKey);
    if (!chart) {
      return NextResponse.json(
        { error: "Failed to calculate natal chart" },
        { status: 500 }
      );
    }

    return NextResponse.json(chart);
  } catch (err) {
    console.error("Natal chart API error:", err);
    return NextResponse.json(
      { error: "Failed to calculate natal chart" },
      { status: 500 }
    );
  }
}
