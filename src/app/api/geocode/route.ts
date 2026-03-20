import { NextRequest, NextResponse } from "next/server";
import { geocodeLocation } from "@/lib/geocode";

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get("q");
  if (!location || location.trim().length < 2) {
    return NextResponse.json(
      { error: "Location query required (min 2 characters)" },
      { status: 400 }
    );
  }

  const result = await geocodeLocation(location.trim());
  if (!result) {
    return NextResponse.json(
      { error: "Location not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
