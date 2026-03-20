"use client";

import type { SynastryReading } from "@/lib/types";
import type { NatalChartData } from "@/lib/types";

interface SynastryReadingDisplayProps {
  reading: SynastryReading;
  chartA?: NatalChartData | null;
  chartB?: NatalChartData | null;
}

export function SynastryReadingDisplay({ reading, chartA, chartB }: SynastryReadingDisplayProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Relationship Overview
        </h2>
        <p className="text-amber-50/95 leading-relaxed">{reading.summary}</p>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Strengths
        </h2>
        <ul className="space-y-2">
          {reading.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-amber-50/95">
              <span className="text-amber-400 mt-0.5">✦</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Growth Areas
        </h2>
        <ul className="space-y-2">
          {reading.challenges.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-amber-50/95">
              <span className="text-amber-400 mt-0.5">◈</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Communication
        </h2>
        <p className="text-amber-50/95 leading-relaxed">{reading.communication}</p>
      </section>

      <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Emotional Connection
        </h2>
        <p className="text-amber-50/95 leading-relaxed">{reading.emotionalConnection}</p>
      </section>

      <section className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
          Advice
        </h2>
        <p className="text-amber-50 leading-relaxed font-medium">{reading.advice}</p>
      </section>

      {(chartA?.planets?.length || chartB?.planets?.length) ? (
        <section className="rounded-xl bg-slate-800/50 border border-amber-500/20 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
            Charts Compared
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartA?.planets?.length ? (
              <div>
                <h3 className="text-xs font-medium text-amber-300 mb-2">Person 1</h3>
                <div className="flex flex-wrap gap-2">
                  {chartA.planets.map((p) => (
                    <span
                      key={p.name}
                      className="px-2 py-1 rounded bg-slate-900/60 text-amber-200/80 text-sm"
                    >
                      {p.name} {p.sign}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {chartB?.planets?.length ? (
              <div>
                <h3 className="text-xs font-medium text-amber-300 mb-2">Person 2</h3>
                <div className="flex flex-wrap gap-2">
                  {chartB.planets.map((p) => (
                    <span
                      key={p.name}
                      className="px-2 py-1 rounded bg-slate-900/60 text-amber-200/80 text-sm"
                    >
                      {p.name} {p.sign}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
