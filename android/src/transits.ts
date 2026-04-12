import { Body, EclipticLongitude, SunPosition } from "astronomy-engine";
import type { BirthData, NatalChartData, PlanetPosition, TransitCalculationData } from "./types";

const FREE_ASTRO_TRANSITS_URL = "https://api.freeastroapi.com/api/v1/transits/calculate";

const SIGNS = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
] as const;

const PLANET_BODIES: { name: string; body: Body }[] = [
  { name: "Sun", body: Body.Sun },
  { name: "Moon", body: Body.Moon },
  { name: "Mercury", body: Body.Mercury },
  { name: "Venus", body: Body.Venus },
  { name: "Mars", body: Body.Mars },
  { name: "Jupiter", body: Body.Jupiter },
  { name: "Saturn", body: Body.Saturn },
  { name: "Uranus", body: Body.Uranus },
  { name: "Neptune", body: Body.Neptune },
  { name: "Pluto", body: Body.Pluto },
];

function longitudeToSignPos(lon: number): { sign: string; pos: number; abs_pos: number } {
  const lonNorm = ((lon % 360) + 360) % 360;
  const idx = Math.floor(lonNorm / 30) % 12;
  const pos = lonNorm - idx * 30;
  return { sign: SIGNS[idx], pos, abs_pos: lonNorm };
}

function natalAbsLongitude(p: PlanetPosition): number {
  const idx = SIGNS.indexOf(p.sign as (typeof SIGNS)[number]);
  if (idx < 0) return 0;
  return idx * 30 + p.pos;
}

function angularSeparation(lon1: number, lon2: number): number {
  let d = Math.abs(lon1 - lon2) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

const ASPECT_TARGETS: { type: string; angle: number; orb: number }[] = [
  { type: "Conjunction", angle: 0, orb: 8 },
  { type: "Sextile", angle: 60, orb: 6 },
  { type: "Square", angle: 90, orb: 8 },
  { type: "Trine", angle: 120, orb: 8 },
  { type: "Opposition", angle: 180, orb: 8 },
];

function classifyAspect(sep: number): { type: string; orb: number } | null {
  for (const a of ASPECT_TARGETS) {
    const dev = Math.abs(sep - a.angle);
    if (dev <= a.orb) return { type: a.type, orb: dev };
  }
  return null;
}

function buildFallbackAspects(
  transitPositions: { name: string; abs_pos: number }[],
  natalPlanets: PlanetPosition[]
): TransitCalculationData["transit_to_natal_aspects"] {
  const out: NonNullable<TransitCalculationData["transit_to_natal_aspects"]> = [];
  for (const t of transitPositions) {
    for (const n of natalPlanets) {
      const nLon = natalAbsLongitude(n);
      const sep = angularSeparation(t.abs_pos, nLon);
      const hit = classifyAspect(sep);
      if (hit) {
        out.push({
          transit_body: t.name,
          natal_body: n.name,
          aspect_type: hit.type,
          orb_degrees: Number(hit.orb.toFixed(2)),
        });
      }
    }
  }
  return out;
}

function summarizeAspects(
  aspects: NonNullable<TransitCalculationData["transit_to_natal_aspects"]>
): TransitCalculationData["aspects_summary"] {
  const by_type: Record<string, number> = {};
  for (const a of aspects) {
    by_type[a.aspect_type] = (by_type[a.aspect_type] ?? 0) + 1;
  }
  const major = aspects.length;
  return { total: major, major, by_type };
}

function mapApiTransitPlanet(p: Record<string, unknown>): PlanetPosition {
  return {
    name: String(p.name ?? ""),
    sign: String(p.sign ?? ""),
    pos: Number(p.pos ?? 0),
    house: p.house != null ? Number(p.house) : undefined,
    retrograde: p.retrograde != null ? Boolean(p.retrograde) : undefined,
    abs_pos: p.abs_pos != null ? Number(p.abs_pos) : undefined,
  };
}

function mapFreeAstroResponse(raw: Record<string, unknown>): TransitCalculationData {
  const transitPlanets = Array.isArray(raw.transit_planets)
    ? (raw.transit_planets as Record<string, unknown>[]).map(mapApiTransitPlanet)
    : [];

  const aspectsRaw = Array.isArray(raw.aspects) ? (raw.aspects as Record<string, unknown>[]) : [];
  const transit_to_natal_aspects = aspectsRaw.map((a) => {
    const between = a.between as Record<string, unknown> | undefined;
    const p1 = String(a.p1 ?? "");
    const p2 = String(a.p2 ?? "");
    return {
      transit_body: between?.transit != null ? String(between.transit) : p2,
      natal_body: between?.natal != null ? String(between.natal) : p1,
      aspect_type: String(a.type ?? ""),
      orb_degrees: Number(a.orb ?? 0),
      description: `${p1} ${String(a.type ?? "")} ${p2}`.replace(/\s+/g, " ").trim(),
      is_applying: a.is_applying != null ? Boolean(a.is_applying) : undefined,
    };
  });

  const summary = raw.aspects_summary as Record<string, unknown> | undefined;
  const by = summary?.by_type as Record<string, number> | undefined;

  return {
    source: "api",
    transit_date: String(raw.transit_date ?? ""),
    transit_time: raw.transit_time != null ? String(raw.transit_time) : undefined,
    transit_planets: transitPlanets,
    transit_to_natal_aspects,
    aspects_summary: summary
      ? {
          total: Number(summary.total ?? 0),
          major: Number(summary.major ?? 0),
          by_type: by ?? {},
        }
      : undefined,
  };
}

function computeFallbackTransits(natalChart: NatalChartData, transitIso: string): TransitCalculationData {
  const when = new Date(transitIso);
  const transitPositions: { name: string; abs_pos: number }[] = [];

  const transit_planets: PlanetPosition[] = [];

  for (const { name, body } of PLANET_BODIES) {
    const lon =
      body === Body.Sun ? SunPosition(when).elon : EclipticLongitude(body, when);
    const { sign, pos, abs_pos } = longitudeToSignPos(lon);
    transitPositions.push({ name, abs_pos });
    transit_planets.push({ name, sign, pos, abs_pos });
  }

  const transit_to_natal_aspects = buildFallbackAspects(transitPositions, natalChart.planets ?? []);
  const aspects_summary = summarizeAspects(transit_to_natal_aspects);

  const [datePart, timePart] = transitIso.split("T");
  return {
    source: "fallback",
    transit_date: datePart ?? transitIso,
    transit_time: timePart,
    location_note:
      "Computed with astronomy-engine (fallback). Add FreeAstro API key in Settings for full transit data.",
    transit_planets,
    transit_to_natal_aspects,
    aspects_summary,
  };
}

export async function getTransitCalculation(
  birthData: BirthData,
  natalChart: NatalChartData,
  transitIso: string,
  apiKey?: string
): Promise<TransitCalculationData> {
  if (apiKey && birthData.lat != null && birthData.lng != null) {
    const [year, month, day] = birthData.date.split("-").map(Number);
    const [hour, minute] = birthData.time.split(":").map(Number);
    const body = {
      natal: {
        name: birthData.name?.trim() || "User",
        city: birthData.location,
        year,
        month,
        day,
        hour: hour ?? 12,
        minute: minute ?? 0,
        lat: birthData.lat,
        lng: birthData.lng,
        tz_str: "AUTO",
      },
      transit_date: transitIso,
      current_city: birthData.location,
      current_lat: birthData.lat,
      current_lng: birthData.lng,
      tz_str: "AUTO",
    };

    try {
      const res = await fetch(FREE_ASTRO_TRANSITS_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const raw = (await res.json()) as Record<string, unknown>;
        return mapFreeAstroResponse(raw);
      }
    } catch {
      // fall through to fallback
    }
  }

  return computeFallbackTransits(natalChart, transitIso);
}

export function formatLocalTransitIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}
