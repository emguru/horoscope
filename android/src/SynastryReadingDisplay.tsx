import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { SynastryReading, NatalChartData } from "./types";

interface SynastryReadingDisplayProps {
  reading: SynastryReading;
  chartA?: NatalChartData | null;
  chartB?: NatalChartData | null;
  nameA?: string;
  nameB?: string;
  roleA?: string;
  roleB?: string;
}

export function SynastryReadingDisplay({
  reading,
  chartA,
  chartB,
  nameA = "Person 1",
  nameB = "Person 2",
  roleA,
  roleB,
}: SynastryReadingDisplayProps) {
  const labelA = roleA ? `${nameA} (${roleA})` : nameA;
  const labelB = roleB ? `${nameB} (${roleB})` : nameB;
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {reading.dailyComparison ? (
        <View style={[styles.section, styles.highlightSection]}>
          <Text style={styles.sectionTitle}>Today&apos;s Energy Comparison</Text>
          <Text style={styles.text}>{reading.dailyComparison}</Text>
        </View>
      ) : null}

      {reading.dailyRelationshipAdvice ? (
        <View style={[styles.section, styles.dailyAdviceSection]}>
          <Text style={styles.sectionTitle}>Relationship Advice for Today</Text>
          <Text style={styles.text}>{reading.dailyRelationshipAdvice}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationship Overview</Text>
        <Text style={styles.text}>{reading.summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strengths</Text>
        {reading.strengths.map((s, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>✦</Text>
            <Text style={styles.text}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Growth Areas</Text>
        {reading.challenges.map((c, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>◈</Text>
            <Text style={styles.text}>{c}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication</Text>
        <Text style={styles.text}>{reading.communication}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotional Connection</Text>
        <Text style={styles.text}>{reading.emotionalConnection}</Text>
      </View>

      <View style={[styles.section, styles.adviceSection]}>
        <Text style={styles.sectionTitle}>Advice</Text>
        <Text style={[styles.text, styles.adviceText]}>{reading.advice}</Text>
      </View>

      {(chartA?.planets?.length || chartB?.planets?.length) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charts Compared</Text>
          <View style={styles.chartRow}>
            {chartA?.planets?.length ? (
              <View style={styles.chartBox}>
                <Text style={styles.chartLabel}>{labelA}</Text>
                {chartA.planets.map((p) => (
                  <Text key={p.name} style={styles.planetChip}>
                    {p.name} {p.sign}
                  </Text>
                ))}
              </View>
            ) : null}
            {chartB?.planets?.length ? (
              <View style={styles.chartBox}>
                <Text style={styles.chartLabel}>{labelB}</Text>
                {chartB.planets.map((p) => (
                  <Text key={p.name} style={styles.planetChip}>
                    {p.name} {p.sign}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  section: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  highlightSection: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  dailyAdviceSection: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.35)",
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
  adviceText: { fontWeight: "500" },
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
  chartRow: {
    flexDirection: "row",
  },
  chartBox: {
    flex: 1,
    marginRight: 12,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fcd34d",
    marginBottom: 8,
  },
  planetChip: {
    fontSize: 12,
    color: "#fde68a99",
    marginBottom: 4,
  },
});
