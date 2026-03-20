import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import * as Network from "expo-network";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { BirthDataForm } from "./src/BirthDataForm";
import { PartnerCompareForm } from "./src/PartnerCompareForm";
import { ReadingDisplay } from "./src/ReadingDisplay";
import { SynastryReadingDisplay } from "./src/SynastryReadingDisplay";
import { SettingsScreen } from "./src/SettingsScreen";
import { AppConfigProvider, useAppConfig } from "./src/AppConfig";
import { fetchNatalChart, fetchReading, fetchSynastryReading } from "./src/api";
import type { DailyReading, SynastryReading, NatalChartData } from "./src/types";

type Mode = "daily" | "compare";

async function getNetworkErrorHint(): Promise<string> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected) {
      return "No internet. Connect to WiFi or mobile data and try again.";
    }
  } catch {
    // ignore
  }
  return "Network error. Check Settings: add OpenAI API key (required for readings).";
}

function MainContent() {
  const { config } = useAppConfig();
  const [mode, setMode] = useState<Mode>("daily");
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [synastryReading, setSynastryReading] = useState<SynastryReading | null>(null);
  const [natalChart, setNatalChart] = useState<NatalChartData | null>(null);
  const [chartA, setChartA] = useState<NatalChartData | null>(null);
  const [chartB, setChartB] = useState<NatalChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const apiConfig = {
    openaiKey: config.openaiKey,
    freeAstroKey: config.freeAstroKey || undefined,
  };

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
    if (!config.openaiKey?.trim()) {
      setError("OpenAI API key required. Go to Settings and add your key from platform.openai.com");
      return;
    }
    setIsLoading(true);

    try {
      const chartData = await fetchNatalChart(data, apiConfig);
      setNatalChart(chartData);

      const today = new Date().toISOString().split("T")[0];
      const readingData = await fetchReading(
        chartData,
        today,
        apiConfig,
        config.pronoun !== "prefer-not-to-say" ? config.pronoun : undefined
      );
      setReading(readingData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(
        msg.includes("Failed to fetch") || msg.includes("Network")
          ? await getNetworkErrorHint()
          : msg
      );
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
    if (!config.openaiKey?.trim()) {
      setError("OpenAI API key required. Go to Settings and add your key from platform.openai.com");
      return;
    }
    setIsLoading(true);

    try {
      const [chartAData, chartBData] = await Promise.all([
        fetchNatalChart(dataA, apiConfig),
        fetchNatalChart(dataB, apiConfig),
      ]);

      setChartA(chartAData);
      setChartB(chartBData);

      const today = new Date().toISOString().split("T")[0];
      const pronoun = config.pronoun !== "prefer-not-to-say" ? config.pronoun : undefined;
      const synastryData = await fetchSynastryReading(
        chartAData,
        chartBData,
        today,
        apiConfig,
        pronoun,
        pronoun
      );
      setSynastryReading(synastryData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(
        msg.includes("Failed to fetch") || msg.includes("Network")
          ? await getNetworkErrorHint()
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (showSettings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.title}>Daily Horoscope Natal Based</Text>
            <Text style={styles.subtitle}>
              Your personalized daily reading or relationship compatibility
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.settingsButtonText}>⚙ Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "daily" && styles.modeButtonActive]}
            onPress={() => {
              setMode("daily");
              clearResults();
            }}
          >
            <Text style={[styles.modeButtonText, mode === "daily" && styles.modeButtonTextActive]}>
              Daily Reading
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === "compare" && styles.modeButtonActive]}
            onPress={() => {
              setMode("compare");
              clearResults();
            }}
          >
            <Text style={[styles.modeButtonText, mode === "compare" && styles.modeButtonTextActive]}>
              Compare Partner
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
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
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {reading ? (
          <View style={styles.readingSection}>
            <Text style={styles.readingTitle}>Your reading for today</Text>
            <ReadingDisplay reading={reading} natalChart={natalChart} />
          </View>
        ) : null}

        {synastryReading ? (
          <View style={styles.readingSection}>
            <Text style={styles.readingTitle}>Relationship compatibility</Text>
            <SynastryReadingDisplay
              reading={synastryReading}
              chartA={chartA}
              chartB={chartB}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppConfigProvider>
      <MainContent />
    </AppConfigProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  header: {
    flex: 1,
  },
  settingsButton: {
    padding: 8,
    marginLeft: 8,
  },
  settingsButtonText: {
    color: "#fbbf24",
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fefce8",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(253, 230, 138, 0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
  modeRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#f59e0b",
  },
  modeButtonText: {
    color: "#fde68a",
    fontSize: 16,
    fontWeight: "500",
  },
  modeButtonTextActive: {
    color: "#0f172a",
    fontWeight: "600",
  },
  formSection: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
  },
  readingSection: {
    marginTop: 24,
  },
  readingTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fefce8",
    marginBottom: 16,
  },
});
