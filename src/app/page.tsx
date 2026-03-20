"use client";

import { use, useState } from "react";
import { BirthDataForm } from "@/components/BirthDataForm";
import { ReadingDisplay } from "@/components/ReadingDisplay";
import type { DailyReading } from "@/lib/types";
import type { NatalChartData } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function Home({ searchParams }: PageProps) {
  use(searchParams ?? Promise.resolve({}));
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [natalChart, setNatalChart] = useState<NatalChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    date: string;
    time: string;
    location: string;
    lat?: number;
    lng?: number;
  }) => {
    setError(null);
    setReading(null);
    setNatalChart(null);
    setIsLoading(true);

    try {
      const chartRes = await fetch("/api/natal-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const chartData = await chartRes.json();

      if (!chartRes.ok) {
        throw new Error(chartData.error || "Failed to calculate natal chart");
      }

      setNatalChart(chartData);

      const today = new Date().toISOString().split("T")[0];
      const readingRes = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          natalChart: chartData,
          todayDate: today,
        }),
      });

      const readingData = await readingRes.json();

      if (!readingRes.ok) {
        throw new Error(readingData.error || "Failed to generate reading");
      }

      setReading(readingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,191,36,0.15),transparent)]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />

      <main className="relative max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-50 tracking-tight">
            Daily Horoscope Natal Based
          </h1>
          <p className="mt-3 text-amber-200/70 text-lg">
            Enter your birth details for a personalized daily reading based on your natal chart
          </p>
        </header>

        <section className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-6 sm:p-8 shadow-xl shadow-amber-500/5">
          <BirthDataForm onSubmit={handleSubmit} isLoading={isLoading} />
        </section>

        {error && (
          <div
            className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {reading && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-amber-50 mb-6">
              Your reading for today
            </h2>
            <ReadingDisplay reading={reading} natalChart={natalChart} />
          </section>
        )}
      </main>
    </div>
  );
}
