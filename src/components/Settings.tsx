"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { PronounOption, StoredBirthData } from "@/lib/types";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    apiUrl: string;
    useCustomKeys: boolean;
    freeAstroKey: string;
    openaiKey: string;
    pronounYou: PronounOption;
    pronounPartner: PronounOption;
    myBirthData: StoredBirthData | null;
    partnerBirthData: StoredBirthData | null;
  };
  onSave: (updates: Partial<{
    apiUrl: string;
    useCustomKeys: boolean;
    freeAstroKey: string;
    openaiKey: string;
    pronounYou: PronounOption;
    pronounPartner: PronounOption;
    myBirthData: StoredBirthData | null;
    partnerBirthData: StoredBirthData | null;
  }>) => void;
}

const emptyBirth: StoredBirthData = { name: "", date: "", time: "12:00", location: "" };

function BirthDataSection({
  title,
  data,
  onChange,
  baseUrl,
  apiHeaders,
}: {
  title: string;
  data: StoredBirthData;
  onChange: (d: StoredBirthData) => void;
  baseUrl: string;
  apiHeaders: Record<string, string>;
}) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleGeocode = useCallback(async () => {
    if (!data.location.trim() || data.location.trim().length < 2) {
      setLocationError("Enter a city or location (min 2 characters)");
      return null;
    }
    setIsGeocoding(true);
    setLocationError("");
    try {
      const res = await fetch(
        `${baseUrl}/api/geocode?q=${encodeURIComponent(data.location.trim())}`,
        { headers: apiHeaders }
      );
      const geo = await res.json();
      if (!res.ok) return null;
      return { lat: geo.lat, lng: geo.lng } as { lat: number; lng: number };
    } catch {
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [data.location, baseUrl, apiHeaders]);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-slate-800/40 border border-amber-500/15">
      <h3 className="text-sm font-semibold text-amber-300">{title}</h3>
      <div>
        <label className="block text-xs font-medium text-amber-100/90 mb-1">Name</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Your name or nickname"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-amber-100/90 mb-1">Birth Date</label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-amber-100/90 mb-1">Birth Time</label>
        <input
          type="time"
          value={data.time}
          onChange={(e) => onChange({ ...data, time: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-amber-100/90 mb-1">Birth Location</label>
        <input
          type="text"
          value={data.location}
          onChange={(e) => { onChange({ ...data, location: e.target.value }); setLocationError(""); }}
          placeholder="e.g. New York, NY"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 text-sm"
        />
        {locationError && <p className="mt-1 text-xs text-amber-400">{locationError}</p>}
      </div>
    </div>
  );
}

export function Settings({ isOpen, onClose, config, onSave }: SettingsProps) {
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [useCustomKeys, setUseCustomKeys] = useState(config.useCustomKeys);
  const [freeAstroKey, setFreeAstroKey] = useState(config.freeAstroKey);
  const [openaiKey, setOpenaiKey] = useState(config.openaiKey);
  const [pronounYou, setPronounYou] = useState<PronounOption>(config.pronounYou);
  const [pronounPartner, setPronounPartner] = useState<PronounOption>(config.pronounPartner);
  const [myBirthData, setMyBirthData] = useState<StoredBirthData>(
    config.myBirthData ?? { ...emptyBirth }
  );
  const [partnerBirthData, setPartnerBirthData] = useState<StoredBirthData>(
    config.partnerBirthData ?? { ...emptyBirth }
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setApiUrl(config.apiUrl);
    setUseCustomKeys(config.useCustomKeys);
    setFreeAstroKey(config.freeAstroKey);
    setOpenaiKey(config.openaiKey);
    setPronounYou(config.pronounYou);
    setPronounPartner(config.pronounPartner);
    setMyBirthData(config.myBirthData ?? { ...emptyBirth });
    setPartnerBirthData(config.partnerBirthData ?? { ...emptyBirth });
  }, [config, isOpen]);

  const baseUrl = apiUrl || "";
  const apiHeaders = useCustomKeys
    ? {
        ...(freeAstroKey && { "x-free-astro-api-key": freeAstroKey }),
        ...(openaiKey && { "x-openai-api-key": openaiKey }),
      }
    : {};

  const geocodeBoth = async () => {
    setIsGeocoding(true);
    try {
      const geoMy =
        myBirthData.location.trim().length >= 2
          ? await fetch(`${baseUrl}/api/geocode?q=${encodeURIComponent(myBirthData.location.trim())}`, { headers: apiHeaders }).then((r) => r.json()).then((d) => (d.lat ? { lat: d.lat, lng: d.lng } : null)).catch(() => null)
          : null;
      const geoPartner =
        partnerBirthData.location.trim().length >= 2
          ? await fetch(`${baseUrl}/api/geocode?q=${encodeURIComponent(partnerBirthData.location.trim())}`, { headers: apiHeaders }).then((r) => r.json()).then((d) => (d.lat ? { lat: d.lat, lng: d.lng } : null)).catch(() => null)
          : null;
      if (geoMy) setMyBirthData((p) => ({ ...p, ...geoMy }));
      if (geoPartner) setPartnerBirthData((p) => ({ ...p, ...geoPartner }));
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = apiUrl.trim();
    if (trimmedUrl && !trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      alert("API URL must start with http:// or https://");
      return;
    }
    onSave({
      apiUrl: trimmedUrl,
      useCustomKeys,
      freeAstroKey: useCustomKeys ? freeAstroKey.trim() : "",
      openaiKey: useCustomKeys ? openaiKey.trim() : "",
      pronounYou,
      pronounPartner,
      myBirthData,
      partnerBirthData,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/20 p-6 shadow-xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="text-xl font-semibold text-amber-50 mb-6">Settings</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-amber-300 mb-3">My info (for &quot;Me&quot;)</h3>
            <BirthDataSection
              title=""
              data={myBirthData}
              onChange={setMyBirthData}
              baseUrl={baseUrl}
              apiHeaders={apiHeaders}
            />
            <div className="mt-4">
              <label htmlFor="pronoun-you" className="block text-xs font-medium text-amber-100/90 mb-1">Your pronouns</label>
              <select
                id="pronoun-you"
                value={pronounYou}
                onChange={(e) => setPronounYou(e.target.value as PronounOption)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="he">He/Him</option>
                <option value="she">She/Her</option>
                <option value="they">They/Them</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-300 mb-3">Partner&apos;s info (for &quot;Us&quot;)</h3>
            <BirthDataSection
              title=""
              data={partnerBirthData}
              onChange={setPartnerBirthData}
              baseUrl={baseUrl}
              apiHeaders={apiHeaders}
            />
            <div className="mt-4">
              <label htmlFor="pronoun-partner" className="block text-xs font-medium text-amber-100/90 mb-1">Partner&apos;s pronouns</label>
              <select
                id="pronoun-partner"
                value={pronounPartner}
                onChange={(e) => setPronounPartner(e.target.value as PronounOption)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="he">He/Him</option>
                <option value="she">She/Her</option>
                <option value="they">They/Them</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="api-url" className="block text-sm font-medium text-amber-100/90 mb-1.5">API Base URL</label>
            <input
              id="api-url"
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="Leave empty for same origin"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <p className="mt-1 text-xs text-amber-200/60">Leave empty to use this site. Set URL if using an external backend.</p>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="use-keys" className="text-sm font-medium text-amber-100/90">Use custom API keys</label>
            <input
              id="use-keys"
              type="checkbox"
              checked={useCustomKeys}
              onChange={(e) => setUseCustomKeys(e.target.checked)}
              className="rounded border-amber-500/30 bg-slate-800 text-amber-500 focus:ring-amber-400/50"
            />
          </div>

          {useCustomKeys && (
            <>
              <div>
                <label htmlFor="free-astro-key" className="block text-sm font-medium text-amber-100/90 mb-1.5">FreeAstro API Key</label>
                <input
                  id="free-astro-key"
                  type="password"
                  value={freeAstroKey}
                  onChange={(e) => setFreeAstroKey(e.target.value)}
                  placeholder="Get free at freeastroapi.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
              <div>
                <label htmlFor="openai-key" className="block text-sm font-medium text-amber-100/90 mb-1.5">OpenAI API Key</label>
                <input
                  id="openai-key"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="From platform.openai.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={geocodeBoth}
              disabled={isGeocoding}
              className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-200 hover:bg-slate-800 transition-colors text-sm"
            >
              {isGeocoding ? "Resolving..." : "Resolve locations"}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-lg border border-amber-500/30 text-amber-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="mt-8 pt-6 border-t border-amber-500/20 text-center text-xs text-amber-200/60">
          Dedicated to Dhru
        </p>
      </div>
    </div>
  );
}
