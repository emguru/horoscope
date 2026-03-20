"use client";

import { useState, useCallback } from "react";
import { BirthDataForm, type ApiConfig } from "./BirthDataForm";

interface BirthData {
  date: string;
  time: string;
  location: string;
  lat?: number;
  lng?: number;
}

interface PartnerCompareFormProps {
  onSubmit: (dataA: BirthData, dataB: BirthData) => void;
  isLoading?: boolean;
  apiConfig?: ApiConfig;
}

export function PartnerCompareForm({ onSubmit, isLoading, apiConfig }: PartnerCompareFormProps) {
  const [dataA, setDataA] = useState<BirthData | null>(null);
  const [dataB, setDataB] = useState<BirthData | null>(null);

  const handleSubmitA = useCallback((data: BirthData) => {
    setDataA(data);
  }, []);

  const handleSubmitB = useCallback((data: BirthData) => {
    setDataB(data);
  }, []);

  const handleCompare = () => {
    if (dataA && dataB) {
      onSubmit(dataA, dataB);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-amber-400 mb-4">Your birth data</h3>
        <BirthDataForm
          onSubmit={handleSubmitA}
          isLoading={isLoading}
          apiConfig={apiConfig}
          submitLabel="Use this chart"
        />
        {dataA && (
          <p className="mt-2 text-xs text-amber-400">
            ✓ Chart saved. Enter partner&apos;s data below.
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-amber-500/20">
        <h3 className="text-sm font-semibold text-amber-400 mb-4">Partner&apos;s birth data</h3>
        <BirthDataForm
          onSubmit={handleSubmitB}
          isLoading={isLoading}
          apiConfig={apiConfig}
          submitLabel="Use this chart"
        />
        {dataB && (
          <p className="mt-2 text-xs text-amber-400">
            ✓ Partner chart saved.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!dataA || !dataB || isLoading}
        className="w-full mt-4 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold transition-colors"
      >
        {isLoading ? "Comparing..." : "Compare relationship"}
      </button>
    </div>
  );
}
