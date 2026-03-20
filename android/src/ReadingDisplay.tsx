import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { DailyReading, NatalChartData } from "./types";

interface ReadingDisplayProps {
  reading: DailyReading;
  natalChart?: NatalChartData | null;
}

export function ReadingDisplay({ reading, natalChart }: ReadingDisplayProps) {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <Text style={styles.text}>{reading.summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planetary Highlights</Text>
        {reading.planetaryHighlights.map((h, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>✦</Text>
            <Text style={styles.text}>{h}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>House Focus</Text>
        <Text style={styles.text}>{reading.houseFocus}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Aspects</Text>
        {reading.keyAspects.map((a, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>◈</Text>
            <Text style={styles.text}>{a}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, styles.adviceSection]}>
        <Text style={styles.sectionTitle}>Advice for Today</Text>
        <Text style={[styles.text, styles.adviceText]}>{reading.advice}</Text>
      </View>

      {natalChart?.planets && natalChart.planets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Natal Chart</Text>
          <View style={styles.planetGrid}>
            {natalChart.planets.map((planet) => (
              <View key={planet.name} style={styles.planetCard}>
                <Text style={styles.planetName}>{planet.name}</Text>
                <Text style={styles.planetPos}>
                  {planet.sign} {planet.pos?.toFixed(1)}°
                  {planet.house != null ? ` (H${planet.house})` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  section: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  adviceSection: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#fbbf24",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  text: {
    fontSize: 15,
    color: "rgba(254, 252, 232, 0.95)",
    lineHeight: 22,
  },
  adviceText: {
    fontWeight: "500",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    color: "#fbbf24",
    marginRight: 8,
    fontSize: 14,
  },
  planetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  planetCard: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 8,
    padding: 12,
    minWidth: "45%",
  },
  planetName: {
    fontWeight: "600",
    color: "#fcd34d",
    fontSize: 14,
  },
  planetPos: {
    fontSize: 12,
    color: "#fde68a99",
    marginTop: 2,
  },
});
