"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const STORAGE_KEY = "horoscope-app-config";

import type { PronounOption } from "./types";
export type { PronounOption };

export interface AppConfig {
  apiUrl: string;
  useCustomKeys: boolean;
  freeAstroKey: string;
  openaiKey: string;
  pronoun: PronounOption;
}

const defaultConfig: AppConfig = {
  apiUrl: "",
  useCustomKeys: false,
  freeAstroKey: "",
  openaiKey: "",
  pronoun: "prefer-not-to-say",
};

function loadFromStorage(): AppConfig {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppConfig>;
      return { ...defaultConfig, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultConfig;
}

function saveToStorage(config: AppConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

type AppConfigContextType = {
  config: AppConfig;
  setConfig: (updates: Partial<AppConfig>) => void;
  saveConfig: () => void;
};

const AppConfigContext = createContext<AppConfigContextType | null>(null);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(defaultConfig);

  useEffect(() => {
    setConfigState(loadFromStorage());
  }, []);

  const setConfig = useCallback((updates: Partial<AppConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(next);
      return next;
    });
  }, []);

  const saveConfig = useCallback(() => {
    saveToStorage(config);
  }, [config]);

  return (
    <AppConfigContext.Provider value={{ config, setConfig, saveConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used within AppConfigProvider");
  return ctx;
}
