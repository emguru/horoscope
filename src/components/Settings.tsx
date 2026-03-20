"use client";

import React, { useState, useEffect } from "react";
import type { PronounOption } from "@/lib/types";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    apiUrl: string;
    useCustomKeys: boolean;
    freeAstroKey: string;
    openaiKey: string;
    pronoun: PronounOption;
  };
  onSave: (updates: {
    apiUrl: string;
    useCustomKeys: boolean;
    freeAstroKey: string;
    openaiKey: string;
    pronoun: PronounOption;
  }) => void;
}

export function Settings({ isOpen, onClose, config, onSave }: SettingsProps) {
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [useCustomKeys, setUseCustomKeys] = useState(config.useCustomKeys);
  const [freeAstroKey, setFreeAstroKey] = useState(config.freeAstroKey);
  const [openaiKey, setOpenaiKey] = useState(config.openaiKey);
  const [pronoun, setPronoun] = useState<PronounOption>(config.pronoun);

  useEffect(() => {
    setApiUrl(config.apiUrl);
    setUseCustomKeys(config.useCustomKeys);
    setFreeAstroKey(config.freeAstroKey);
    setOpenaiKey(config.openaiKey);
    setPronoun(config.pronoun);
  }, [config, isOpen]);

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
      pronoun,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/20 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="text-xl font-semibold text-amber-50 mb-6">Settings</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="api-url" className="block text-sm font-medium text-amber-100/90 mb-1.5">
              API Base URL
            </label>
            <input
              id="api-url"
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="Leave empty for same origin"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <p className="mt-1 text-xs text-amber-200/60">
              Leave empty to use this site. Set URL if using an external backend.
            </p>
          </div>

          <div>
            <label htmlFor="pronoun" className="block text-sm font-medium text-amber-100/90 mb-1.5">
              Pronouns (for readings)
            </label>
            <select
              id="pronoun"
              value={pronoun}
              onChange={(e) => setPronoun(e.target.value as PronounOption)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="he">He/Him</option>
              <option value="she">She/Her</option>
              <option value="they">They/Them</option>
            </select>
            <p className="mt-1 text-xs text-amber-200/60">
              Used to personalize reading language.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="use-keys" className="text-sm font-medium text-amber-100/90">
              Use custom API keys
            </label>
            <input
              id="use-keys"
              type="checkbox"
              checked={useCustomKeys}
              onChange={(e) => setUseCustomKeys(e.target.checked)}
              className="rounded border-amber-500/30 bg-slate-800 text-amber-500 focus:ring-amber-400/50"
            />
          </div>
          <p className="text-xs text-amber-200/60">
            When enabled, your keys are sent with requests. Otherwise the server uses its .env keys.
          </p>

          {useCustomKeys && (
            <>
              <div>
                <label htmlFor="free-astro-key" className="block text-sm font-medium text-amber-100/90 mb-1.5">
                  FreeAstro API Key
                </label>
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
                <label htmlFor="openai-key" className="block text-sm font-medium text-amber-100/90 mb-1.5">
                  OpenAI API Key
                </label>
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
      </div>
    </div>
  );
}
