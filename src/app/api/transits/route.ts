import { NextRequest, NextResponse } from "next/server";
import { getTransitCalculation } from "@/lib/transits";
import type { BirthData, NatalChartData } from "@/lib/types";

/** Local civil time YYYY-MM-DDTHH:mm (no timezone suffix) */
function defaultLocalTransitIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      birthData: BirthData;
      natalChart: NatalChartData;
      transitDate?: string;
    };
    const { birthData, natalChart, transitDate } = body;

    if (!birthData?.date || !birthData?.time || !birthData?.location) {
      return NextResponse.json(
        { error: "Birth date, time, and location are required" },
        { status: 400 }
      );
    }
    if (!natalChart?.planets?.length) {
      return NextResponse.json(
        { error: "Natal chart required for transit calculation" },
        { status: 400 }
      );
    }
    if (birthData.lat == null || birthData.lng == null) {
      return NextResponse.json(
        {
          error:
            "Latitude and longitude are required for transits. Open Settings and re-save your birth place so it can be geocoded.",
        },
        { status: 400 }
      );
    }

    const iso = transitDate?.trim() || defaultLocalTransitIso();
    const apiKey = request.headers.get("x-free-astro-api-key") || undefined;
    const data = await getTransitCalculation(birthData, natalChart, iso, apiKey);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Transits API error:", err);
    return NextResponse.json({ error: "Failed to calculate transits" }, { status: 500 });
  }
}
