"use client";

import { use, useState } from "react";
import { ReadingDisplay } from "@/components/ReadingDisplay";
import { SynastryReadingDisplay } from "@/components/SynastryReadingDisplay";
import { Settings } from "@/components/Settings";
import { ZodiacWheel } from "@/components/ZodiacWheel";
import { AppConfigProvider, useAppConfig } from "@/lib/AppConfig";
import type { DailyReading, SynastryReading, StoredBirthData } from "@/lib/types";
import type { NatalChartData } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type Mode = "me" | "us";

function birthDataToApiFormat(d: StoredBirthData) {
  return {
    date: d.date,
    time: d.time,
    location: d.location.trim(),
    lat: d.lat,
    lng: d.lng,
    name: d.name.trim() || undefined,
  };
}

/** Local civil time for transit calculations (YYYY-MM-DDTHH:mm) */
function formatLocalTransitIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function MainContent({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  use(searchParams ?? Promise.resolve({}));
  const { config, setConfig } = useAppConfig();
  const [mode, setMode] = useState<Mode | null>(null);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [synastryReading, setSynastryReading] = useState<SynastryReading | null>(null);
  const [natalChart, setNatalChart] = useState<NatalChartData | null>(null);
  const [chartA, setChartA] = useState<NatalChartData | null>(null);
  const [chartB, setChartB] = useState<NatalChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const baseUrl = config.apiUrl || "";
  const apiHeaders = config.useCustomKeys
    ? {
        ...(config.freeAstroKey && { "x-free-astro-api-key": config.freeAstroKey }),
        ...(config.openaiKey && { "x-openai-api-key": config.openaiKey }),
      }
    : {};

  const clearResults = () => {
    setReading(null);
    setSynastryReading(null);
    setNatalChart(null);
    setChartA(null);
    setChartB(null);
  };

  const handleMe = async () => {
    setMode("me");
    setError(null);
    clearResults();
    if (!config.myBirthData) {
      setError("Add your birth data in Settings first.");
      return;
    }
    const data = birthDataToApiFormat(config.myBirthData);
    if (!data.date || !data.time || data.location.length < 2) {
      setError("Complete your birth data in Settings (name, date, time, location).");
      return;
    }
    if (data.lat == null || data.lng == null) {
      setError("Birth coordinates are missing. Open Settings and re-save your birth place so it can be geocoded.");
      return;
    }
    setIsLoading(true);
    try {
      const chartRes = await fetch(`${baseUrl}/api/natal-chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify(data),
      });
      const chartData = await chartRes.json();
      if (!chartRes.ok) throw new Error(chartData.error || "Failed to calculate natal chart");
      if (chartData.subject) chartData.subject.name = config.myBirthData.name.trim() || chartData.subject.name;
      setNatalChart(chartData);

      const transitIso = formatLocalTransitIso(new Date());
      const transitsRes = await fetch(`${baseUrl}/api/transits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify({
          birthData: data,
          natalChart: chartData,
          transitDate: transitIso,
        }),
      });
      const transitData = await transitsRes.json();
      if (!transitsRes.ok) throw new Error(transitData.error || "Failed to calculate transits");

      const today = new Date().toISOString().split("T")[0];
      const readingRes = await fetch(`${baseUrl}/api/reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify({
          natalChart: chartData,
          transitData,
          todayDate: today,
          pronoun: config.pronounYou,
          subjectName: config.myBirthData?.name?.trim() || undefined,
        }),
      });
      const readingData = await readingRes.json();
      if (!readingRes.ok) throw new Error(readingData.error || "Failed to generate reading");
      setReading(readingData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg.includes("Failed to fetch") ? "Network error. Check Settings and ensure the backend is reachable." : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUs = async () => {
    setMode("us");
    setError(null);
    clearResults();
    if (!config.myBirthData || !config.partnerBirthData) {
      setError("Add both your and your partner's birth data in Settings first.");
      return;
    }
    const dataA = birthDataToApiFormat(config.myBirthData);
    const dataB = birthDataToApiFormat(config.partnerBirthData);
    if (
      !dataA.date || !dataA.time || dataA.location.length < 2 ||
      !dataB.date || !dataB.time || dataB.location.length < 2
    ) {
      setError("Complete both birth records in Settings (name, date, time, location for each).");
      return;
    }
    if (dataA.lat == null || dataA.lng == null || dataB.lat == null || dataB.lng == null) {
      setError("Birth coordinates are missing for one or both people. Re-save birth places in Settings so they can be geocoded.");
      return;
    }
    setIsLoading(true);
    try {
      const [chartARes, chartBRes] = await Promise.all([
        fetch(`${baseUrl}/api/natal-chart`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...apiHeaders },
          body: JSON.stringify(dataA),
        }),
        fetch(`${baseUrl}/api/natal-chart`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...apiHeaders },
          body: JSON.stringify(dataB),
        }),
      ]);
      const chartAData = await chartARes.json();
      const chartBData = await chartBRes.json();
      if (!chartARes.ok) throw new Error(chartAData.error || "Failed to calculate your chart");
      if (!chartBRes.ok) throw new Error(chartBData.error || "Failed to calculate partner chart");
      if (chartAData.subject) chartAData.subject.name = config.myBirthData.name.trim() || chartAData.subject.name;
      if (chartBData.subject) chartBData.subject.name = config.partnerBirthData.name.trim() || chartBData.subject.name;
      setChartA(chartAData);
      setChartB(chartBData);

      const transitIso = formatLocalTransitIso(new Date());
      const [transitsARes, transitsBRes] = await Promise.all([
        fetch(`${baseUrl}/api/transits`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...apiHeaders },
          body: JSON.stringify({
            birthData: dataA,
            natalChart: chartAData,
            transitDate: transitIso,
          }),
        }),
        fetch(`${baseUrl}/api/transits`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...apiHeaders },
          body: JSON.stringify({
            birthData: dataB,
            natalChart: chartBData,
            transitDate: transitIso,
          }),
        }),
      ]);
      const transitA = await transitsARes.json();
      const transitB = await transitsBRes.json();
      if (!transitsARes.ok) throw new Error(transitA.error || "Failed to calculate transits for you");
      if (!transitsBRes.ok) throw new Error(transitB.error || "Failed to calculate transits for partner");

      const today = new Date().toISOString().split("T")[0];
      const synastryRes = await fetch(`${baseUrl}/api/synastry-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify({
          chartA: chartAData,
          chartB: chartBData,
          todayDate: today,
          pronounA: config.pronounYou,
          pronounB: config.pronounPartner,
          transitForA: transitA,
          transitForB: transitB,
        }),
      });
      const synastryData = await synastryRes.json();
      if (!synastryRes.ok) throw new Error(synastryData.error || "Failed to generate synastry reading");
      setSynastryReading(synastryData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg.includes("Failed to fetch") ? "Network error. Check Settings and ensure the backend is reachable." : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,191,36,0.15),transparent)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />

        <main className="relative max-w-2xl mx-auto px-4 py-12 sm:py-16">
          <header className="flex items-start justify-between gap-4 mb-12">
            <div className="text-center flex-1">
              <h1 className="text-4xl sm:text-5xl font-bold text-amber-50 tracking-tight">
                Daily Horoscope
              </h1>
              <p className="mt-3 text-amber-200/70 text-lg">
                Your personalized daily reading or relationship compatibility
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="shrink-0 px-3 py-2 text-amber-400 hover:text-amber-300 transition-colors"
              aria-label="Settings"
            >
              ⚙ Settings
            </button>
          </header>

          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={handleMe}
              disabled={isLoading}
              className={`flex-1 py-5 px-6 rounded-xl font-semibold text-lg transition-colors ${
                mode === "me"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/60 text-amber-200 hover:bg-slate-800 border border-amber-500/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading && mode === "me" ? "Loading..." : "Me"}
            </button>
            <button
              type="button"
              onClick={handleUs}
              disabled={isLoading}
              className={`flex-1 py-5 px-6 rounded-xl font-semibold text-lg transition-colors ${
                mode === "us"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/60 text-amber-200 hover:bg-slate-800 border border-amber-500/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading && mode === "us" ? "Loading..." : "Us"}
            </button>
          </div>

          <ZodiacWheel
            myBirthData={config.myBirthData}
            partnerBirthData={config.partnerBirthData}
          />

          <p className="text-center text-amber-200/60 text-sm mb-8">
            Set your birth data (and your partner&apos;s for Us) in Settings. It&apos;s stored locally.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300" role="alert">
              {error}
            </div>
          )}

          {reading && (
            <section className="mt-8">
              <h2 className="text-2xl font-semibold text-amber-50 mb-6">Your reading for today</h2>
              <ReadingDisplay reading={reading} natalChart={natalChart} />
            </section>
          )}

          {synastryReading && (
            <section className="mt-8">
              <h2 className="text-2xl font-semibold text-amber-50 mb-6">
                {config.myBirthData?.name && config.partnerBirthData?.name
                  ? `${config.myBirthData.name} & ${config.partnerBirthData.name}`
                  : "Relationship compatibility"}
              </h2>
              <SynastryReadingDisplay
                reading={synastryReading}
                chartA={chartA}
                chartB={chartB}
                nameA={config.myBirthData?.name}
                nameB={config.partnerBirthData?.name}
                roleA="You"
                roleB="Partner"
              />
            </section>
          )}
        </main>
      </div>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onSave={(updates) => setConfig(updates)}
      />
    </>
  );
}

export default function Home({ searchParams }: PageProps) {
  return (
    <AppConfigProvider>
      <MainContent searchParams={searchParams} />
    </AppConfigProvider>
  );
}
