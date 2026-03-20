"use client";

import { use, useState } from "react";
import { BirthDataForm } from "@/components/BirthDataForm";
import { PartnerCompareForm } from "@/components/PartnerCompareForm";
import { ReadingDisplay } from "@/components/ReadingDisplay";
import { SynastryReadingDisplay } from "@/components/SynastryReadingDisplay";
import { Settings } from "@/components/Settings";
import { AppConfigProvider, useAppConfig } from "@/lib/AppConfig";
import type { DailyReading, SynastryReading } from "@/lib/types";
import type { NatalChartData } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type Mode = "daily" | "compare";

function MainContent({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  use(searchParams ?? Promise.resolve({}));
  const { config, setConfig } = useAppConfig();
  const [mode, setMode] = useState<Mode>("daily");
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
  const apiConfig = { baseUrl, headers: apiHeaders };

  const clearResults = () => {
    setReading(null);
    setSynastryReading(null);
    setNatalChart(null);
    setChartA(null);
    setChartB(null);
  };

  const handleDailySubmit = async (data: {
    date: string;
    time: string;
    location: string;
    lat?: number;
    lng?: number;
  }) => {
    setError(null);
    clearResults();
    setIsLoading(true);

    try {
      const chartRes = await fetch(`${baseUrl}/api/natal-chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify(data),
      });

      const chartData = await chartRes.json();
      if (!chartRes.ok) throw new Error(chartData.error || "Failed to calculate natal chart");
      setNatalChart(chartData);

      const today = new Date().toISOString().split("T")[0];
      const readingRes = await fetch(`${baseUrl}/api/reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify({
          natalChart: chartData,
          todayDate: today,
          pronoun: config.pronoun,
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

  const handleCompareSubmit = async (
    dataA: { date: string; time: string; location: string; lat?: number; lng?: number },
    dataB: { date: string; time: string; location: string; lat?: number; lng?: number }
  ) => {
    setError(null);
    clearResults();
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

      if (!chartARes.ok) throw new Error(chartAData.error || "Failed to calculate chart 1");
      if (!chartBRes.ok) throw new Error(chartBData.error || "Failed to calculate chart 2");

      setChartA(chartAData);
      setChartB(chartBData);

      const today = new Date().toISOString().split("T")[0];
      const synastryRes = await fetch(`${baseUrl}/api/synastry-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders },
        body: JSON.stringify({
          chartA: chartAData,
          chartB: chartBData,
          todayDate: today,
          pronounA: config.pronoun,
          pronounB: config.pronoun,
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
                Daily Horoscope Natal Based
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

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode("daily"); clearResults(); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === "daily"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/60 text-amber-200 hover:bg-slate-800"
              }`}
            >
              Daily Reading
            </button>
            <button
              type="button"
              onClick={() => { setMode("compare"); clearResults(); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === "compare"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/60 text-amber-200 hover:bg-slate-800"
              }`}
            >
              Compare with Partner
            </button>
          </div>

          <section className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-6 sm:p-8 shadow-xl shadow-amber-500/5">
            {mode === "daily" ? (
              <BirthDataForm
                onSubmit={handleDailySubmit}
                isLoading={isLoading}
                apiConfig={apiConfig}
              />
            ) : (
              <PartnerCompareForm
                onSubmit={handleCompareSubmit}
                isLoading={isLoading}
                apiConfig={apiConfig}
              />
            )}
          </section>

          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300" role="alert">
              {error}
            </div>
          )}

          {reading && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-amber-50 mb-6">Your reading for today</h2>
              <ReadingDisplay reading={reading} natalChart={natalChart} />
            </section>
          )}

          {synastryReading && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-amber-50 mb-6">Relationship compatibility</h2>
              <SynastryReadingDisplay
                reading={synastryReading}
                chartA={chartA}
                chartB={chartB}
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
