"use client";

import type { DailyReading } from "@/lib/types";
import type { NatalChartData } from "@/lib/types";

interface ReadingDisplayProps {
  reading: DailyReading;
  natalChart?: NatalChartData | null;
}

export function ReadingDisplay({ reading, natalChart }: ReadingDisplayProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Today&apos;s Overview
        </h2>
        <p className="text-amber-50/95 leading-relaxed">{reading.summary}</p>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Planetary Highlights
        </h2>
        <ul className="space-y-2">
          {reading.planetaryHighlights.map((highlight, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-amber-50/95"
            >
              <span className="text-amber-400 mt-0.5">✦</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          House Focus
        </h2>
        <p className="text-amber-50/95 leading-relaxed">{reading.houseFocus}</p>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Key Aspects
        </h2>
        <ul className="space-y-2">
          {reading.keyAspects.map((aspect, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-amber-50/95"
            >
              <span className="text-amber-400 mt-0.5">◈</span>
              <span>{aspect}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Advice for Today
        </h2>
        <p className="text-amber-50 leading-relaxed font-medium">{reading.advice}</p>
      </section>

      {natalChart?.planets && natalChart.planets.length > 0 && (
        <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
            Your Natal Chart
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {natalChart.planets.map((planet) => (
              <div
                key={planet.name}
                className="px-3 py-2 rounded-lg bg-slate-900/60 border border-amber-500/10"
              >
                <span className="font-medium text-amber-300">{planet.name}</span>
                <span className="block text-sm text-amber-200/60">
                  {planet.sign} {planet.pos?.toFixed(1)}°
                  {planet.house != null ? ` (H${planet.house})` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
