"use client";

import { useMemo, useState } from "react";
import { getTropicalSunSignAbbrev } from "@/lib/natal-chart";
import {
  SIGN_FULL_NAME,
  SIGN_SUN_DATE_RANGE,
  ZODIAC_WHEEL_SIGN_ABBREVS,
  type TropicalSignAbbrev,
} from "@/lib/zodiac-signs";
import type { StoredBirthData } from "@/lib/types";

const ZODIAC = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"] as const;

function asTextSymbol(ch: string): string {
  return `${ch}\uFE0E`;
}

const R_SYMBOLS = 78;
const R_TICKS_OUTER = 92;
const R_TICKS_INNER = 58;
const HIT_R = 22;

function sunSignFromProfile(data: StoredBirthData | null): TropicalSignAbbrev | null {
  if (!data?.date) return null;
  const parts = data.date.split("-").map(Number);
  const m = parts[1];
  const d = parts[2];
  if (m == null || d == null || Number.isNaN(m) || Number.isNaN(d)) return null;
  return getTropicalSunSignAbbrev(m, d) as TropicalSignAbbrev;
}

function formatBirthLine(data: StoredBirthData): string {
  const date = data.date || "—";
  const time = data.time?.trim() ? ` at ${data.time}` : "";
  return `${date}${time}`;
}

export type ZodiacWheelProps = {
  myBirthData: StoredBirthData | null;
  partnerBirthData: StoredBirthData | null;
};

export function ZodiacWheel({ myBirthData, partnerBirthData }: ZodiacWheelProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const mySign = useMemo(() => sunSignFromProfile(myBirthData), [myBirthData]);
  const partnerSign = useMemo(() => sunSignFromProfile(partnerBirthData), [partnerBirthData]);

  const selectedAbbrev =
    selectedIdx != null ? ZODIAC_WHEEL_SIGN_ABBREVS[selectedIdx] : null;

  const youMatch = selectedAbbrev != null && mySign === selectedAbbrev;
  const partnerMatch = selectedAbbrev != null && partnerSign === selectedAbbrev;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <p className="mb-3 text-center text-xs text-amber-200/55">
        Tap a sign for Sun dates and who in your profiles matches
      </p>
      <div className="relative mx-auto w-[min(260px,82vw)] aspect-square max-w-[260px]">
        <svg
          viewBox="0 0 200 200"
          className="zodiac-wheel-spin h-full w-full text-amber-500 drop-shadow-[0_0_24px_rgba(245,158,11,0.2)]"
          role="presentation"
        >
          <title>Zodiac wheel — tap a sign</title>
          <defs>
            <linearGradient id="zodiac-wheel-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(245 158 11 / 0.55)" />
              <stop offset="50%" stopColor="rgb(245 158 11 / 0.2)" />
              <stop offset="100%" stopColor="rgb(217 119 6 / 0.4)" />
            </linearGradient>
            <radialGradient id="zodiac-hub" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(245 158 11 / 0.3)" />
              <stop offset="70%" stopColor="rgb(15 23 42 / 0.5)" />
              <stop offset="100%" stopColor="rgb(15 23 42 / 0.9)" />
            </radialGradient>
          </defs>

          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="url(#zodiac-wheel-gold)"
            strokeWidth="1.25"
            opacity={0.9}
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.4"
            opacity={0.4}
            strokeDasharray="3 5"
          />

          {Array.from({ length: 12 }).map((_, i) => {
            const a0 = ((-90 + i * 30) * Math.PI) / 180;
            const x0 = 100 + R_TICKS_INNER * Math.cos(a0);
            const y0 = 100 + R_TICKS_INNER * Math.sin(a0);
            const x1 = 100 + R_TICKS_OUTER * Math.cos(a0);
            const y1 = 100 + R_TICKS_OUTER * Math.sin(a0);
            return (
              <line
                key={`tick-${i}`}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke="currentColor"
                strokeWidth="0.5"
                opacity={0.35}
              />
            );
          })}

          {ZODIAC.map((sym, i) => {
            const angle = ((-90 + i * 30) * Math.PI) / 180;
            const x = 100 + R_SYMBOLS * Math.cos(angle);
            const y = 100 + R_SYMBOLS * Math.sin(angle);
            const abbrev = ZODIAC_WHEEL_SIGN_ABBREVS[i];
            const isSel = selectedIdx === i;
            return (
              <g
                key={sym}
                role="button"
                tabIndex={0}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded-full"
                onClick={() => setSelectedIdx((prev) => (prev === i ? null : i))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedIdx((prev) => (prev === i ? null : i));
                  }
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={HIT_R}
                  fill="transparent"
                  style={{ pointerEvents: "all" }}
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSel ? "#fcd34d" : "#f59e0b"}
                  style={{
                    fontSize: "22px",
                    fontFamily:
                      'ui-serif, "Times New Roman", "Noto Serif", "Apple Symbols", serif',
                    pointerEvents: "none",
                  }}
                >
                  {asTextSymbol(sym)}
                </text>
                <title>{SIGN_FULL_NAME[abbrev]}</title>
              </g>
            );
          })}

          <circle
            cx="100"
            cy="100"
            r="36"
            fill="url(#zodiac-hub)"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity={0.9}
            className="cursor-pointer"
            onClick={() => setSelectedIdx(null)}
          >
            <title>Clear sign selection</title>
          </circle>
          <text
            x="100"
            y="100"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#f59e0b"
            style={{
              fontSize: "26px",
              fontFamily:
                'ui-serif, "Times New Roman", "Noto Serif", "Apple Symbols", serif',
              pointerEvents: "none",
            }}
          >
            {asTextSymbol("☉")}
          </text>
        </svg>
      </div>

      {selectedAbbrev != null && (
        <div
          className="mt-6 w-full max-w-md rounded-xl border border-amber-500/30 bg-slate-900/90 px-4 py-4 text-left shadow-lg shadow-amber-950/20"
          role="region"
          aria-live="polite"
        >
          <h3 className="text-lg font-semibold text-amber-50">
            {SIGN_FULL_NAME[selectedAbbrev]}
          </h3>
          <p className="mt-1 text-sm text-amber-200/85">
            Typical tropical Sun dates:{" "}
            <span className="text-amber-100">{SIGN_SUN_DATE_RANGE[selectedAbbrev]}</span>
          </p>

          <div className="mt-4 space-y-3 border-t border-amber-500/15 pt-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
                Me
              </p>
              {myBirthData?.date ? (
                youMatch ? (
                  <p className="mt-1 text-amber-100">
                    <span className="font-medium text-amber-50">
                      {myBirthData.name?.trim() || "You"}
                    </span>
                    {" — "}
                    born {formatBirthLine(myBirthData)}
                  </p>
                ) : (
                  <p className="mt-1 text-amber-200/65">
                    Your Sun is in {mySign ? SIGN_FULL_NAME[mySign] : "—"} (not this sign).
                  </p>
                )
              ) : (
                <p className="mt-1 text-amber-200/55">No birth date saved for Me in Settings.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
                Partner
              </p>
              {partnerBirthData?.date ? (
                partnerMatch ? (
                  <p className="mt-1 text-amber-100">
                    <span className="font-medium text-amber-50">
                      {partnerBirthData.name?.trim() || "Partner"}
                    </span>
                    {" — "}
                    born {formatBirthLine(partnerBirthData)}
                  </p>
                ) : (
                  <p className="mt-1 text-amber-200/65">
                    Partner&apos;s Sun is in{" "}
                    {partnerSign ? SIGN_FULL_NAME[partnerSign] : "—"} (not this sign).
                  </p>
                )
              ) : (
                <p className="mt-1 text-amber-200/55">
                  No birth date saved for Partner in Settings.
                </p>
              )}
            </div>

            {!youMatch && !partnerMatch && myBirthData?.date && partnerBirthData?.date && (
              <p className="text-amber-200/70">
                Neither profile has the Sun in {SIGN_FULL_NAME[selectedAbbrev]}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
