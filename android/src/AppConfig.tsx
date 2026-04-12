import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PronounOption, StoredBirthData } from "./types";

const STORAGE_KEYS = {
  FREE_ASTRO_KEY: "@horoscope/free_astro_key",
  OPENAI_KEY: "@horoscope/openai_key",
  /** Legacy single pronoun — migrated to pronounYou / pronounPartner */
  PRONOUN: "@horoscope/pronoun",
  PRONOUN_YOU: "@horoscope/pronoun_you",
  PRONOUN_PARTNER: "@horoscope/pronoun_partner",
  MY_BIRTH_DATA: "@horoscope/my_birth_data",
  PARTNER_BIRTH_DATA: "@horoscope/partner_birth_data",
};

export interface AppConfig {
  freeAstroKey: string;
  openaiKey: string;
  pronounYou: PronounOption;
  pronounPartner: PronounOption;
  myBirthData: StoredBirthData | null;
  partnerBirthData: StoredBirthData | null;
}

const defaultConfig: AppConfig = {
  freeAstroKey: "",
  openaiKey: "",
  pronounYou: "prefer-not-to-say",
  pronounPartner: "prefer-not-to-say",
  myBirthData: null,
  partnerBirthData: null,
};

type AppConfigContextType = {
  config: AppConfig;
  setConfig: (updates: Partial<AppConfig>) => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
};

const AppConfigContext = createContext<AppConfigContextType | null>(null);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(defaultConfig);

  const loadConfig = useCallback(async () => {
    try {
      const [freeAstroKey, openaiKey, pronounYou, pronounPartner, legacyPronoun, myBirthData, partnerBirthData] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FREE_ASTRO_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.OPENAI_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.PRONOUN_YOU),
          AsyncStorage.getItem(STORAGE_KEYS.PRONOUN_PARTNER),
          AsyncStorage.getItem(STORAGE_KEYS.PRONOUN),
          AsyncStorage.getItem(STORAGE_KEYS.MY_BIRTH_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.PARTNER_BIRTH_DATA),
        ]);
      const legacy = (legacyPronoun as PronounOption) || undefined;
      setConfigState({
        freeAstroKey: freeAstroKey || "",
        openaiKey: openaiKey || "",
        pronounYou: (pronounYou as PronounOption) || legacy || "prefer-not-to-say",
        pronounPartner: (pronounPartner as PronounOption) || legacy || "prefer-not-to-say",
        myBirthData: myBirthData ? (JSON.parse(myBirthData) as StoredBirthData) : null,
        partnerBirthData: partnerBirthData ? (JSON.parse(partnerBirthData) as StoredBirthData) : null,
      });
    } catch {
      // use defaults
    }
  }, []);

  const saveConfig = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.FREE_ASTRO_KEY, config.freeAstroKey),
        AsyncStorage.setItem(STORAGE_KEYS.OPENAI_KEY, config.openaiKey),
        AsyncStorage.setItem(STORAGE_KEYS.PRONOUN_YOU, config.pronounYou),
        AsyncStorage.setItem(STORAGE_KEYS.PRONOUN_PARTNER, config.pronounPartner),
        AsyncStorage.setItem(STORAGE_KEYS.MY_BIRTH_DATA, config.myBirthData ? JSON.stringify(config.myBirthData) : ""),
        AsyncStorage.setItem(STORAGE_KEYS.PARTNER_BIRTH_DATA, config.partnerBirthData ? JSON.stringify(config.partnerBirthData) : ""),
      ]);
    } catch (e) {
      console.error("Failed to save config:", e);
    }
  }, [config]);

  const setConfig = useCallback((updates: Partial<AppConfig>) => {
    setConfigState((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <AppConfigContext.Provider value={{ config, setConfig, saveConfig, loadConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used within AppConfigProvider");
  return ctx;
}
