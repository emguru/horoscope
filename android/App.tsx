import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import * as Network from "expo-network";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ReadingDisplay } from "./src/ReadingDisplay";
import { SynastryReadingDisplay } from "./src/SynastryReadingDisplay";
import { SettingsScreen } from "./src/SettingsScreen";
import { AppConfigProvider, useAppConfig } from "./src/AppConfig";
import { fetchNatalChart, fetchReading, fetchSynastryReading } from "./src/api";
import type { DailyReading, SynastryReading, NatalChartData, StoredBirthData } from "./src/types";

type Mode = "me" | "us";

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

function MainContent() {
  const { config } = useAppConfig();
  const [mode, setMode] = useState<Mode | null>(null);
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

  const handleMe = async () => {
    setMode("me");
    setError(null);
    clearResults();
    if (!config.openaiKey?.trim()) {
      setError("OpenAI API key required. Go to Settings and add your key from platform.openai.com");
      return;
    }
    if (!config.myBirthData) {
      setError("Add your birth data in Settings first.");
      return;
    }
    const data = birthDataToApiFormat(config.myBirthData);
    if (!data.date || !data.time || data.location.length < 2) {
      setError("Complete your birth data in Settings (name, date, time, location).");
      return;
    }
    setIsLoading(true);
    try {
      const chartData = await fetchNatalChart(data, apiConfig);
      if (chartData.subject) chartData.subject.name = config.myBirthData.name.trim() || chartData.subject.name;
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

  const handleUs = async () => {
    setMode("us");
    setError(null);
    clearResults();
    if (!config.openaiKey?.trim()) {
      setError("OpenAI API key required. Go to Settings and add your key from platform.openai.com");
      return;
    }
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
    setIsLoading(true);
    try {
      const [chartAData, chartBData] = await Promise.all([
        fetchNatalChart(dataA, apiConfig),
        fetchNatalChart(dataB, apiConfig),
      ]);
      if (chartAData.subject) chartAData.subject.name = config.myBirthData.name.trim() || chartAData.subject.name;
      if (chartBData.subject) chartBData.subject.name = config.partnerBirthData.name.trim() || chartBData.subject.name;
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
            <Text style={styles.title}>Daily Horoscope</Text>
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

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.mainButton, mode === "me" && styles.mainButtonActive, isLoading && styles.mainButtonDisabled]}
            onPress={handleMe}
            disabled={isLoading}
          >
            <Text style={[styles.mainButtonText, mode === "me" && styles.mainButtonTextActive]}>
              {isLoading && mode === "me" ? "Loading..." : "Me"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainButton, mode === "us" && styles.mainButtonActive, isLoading && styles.mainButtonDisabled]}
            onPress={handleUs}
            disabled={isLoading}
          >
            <Text style={[styles.mainButtonText, mode === "us" && styles.mainButtonTextActive]}>
              {isLoading && mode === "us" ? "Loading..." : "Us"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Set your birth data (and your partner&apos;s for Us) in Settings. It&apos;s stored locally.
        </Text>

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
            <Text style={styles.readingTitle}>
              {config.myBirthData?.name && config.partnerBirthData?.name
                ? `${config.myBirthData.name} & ${config.partnerBirthData.name}`
                : "Relationship compatibility"}
            </Text>
            <SynastryReadingDisplay
              reading={synastryReading}
              chartA={chartA}
              chartB={chartB}
              nameA={config.myBirthData?.name}
              nameB={config.partnerBirthData?.name}
              roleA="You"
              roleB="Partner"
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppConfigProvider>
        <MainContent />
      </AppConfigProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#020617" },
  scrollView: { flex: 1 },
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
  header: { flex: 1 },
  settingsButton: { padding: 8, marginLeft: 8 },
  settingsButtonText: { color: "#fbbf24", fontSize: 16 },
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
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  mainButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    alignItems: "center",
  },
  mainButtonActive: { backgroundColor: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.5)" },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: { color: "#fde68a", fontSize: 20, fontWeight: "600" },
  mainButtonTextActive: { color: "#0f172a" },
  hint: {
    fontSize: 13,
    color: "rgba(253, 230, 138, 0.6)",
    textAlign: "center",
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
  errorText: { color: "#fca5a5", fontSize: 14 },
  readingSection: { marginTop: 24 },
  readingTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fefce8",
    marginBottom: 16,
  },
});
