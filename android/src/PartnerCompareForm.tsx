import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BirthDataForm } from "./BirthDataForm";
import type { ApiConfig } from "./api";

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
  apiConfig: ApiConfig;
}

export function PartnerCompareForm({
  onSubmit,
  isLoading,
  apiConfig,
}: PartnerCompareFormProps) {
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
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your birth data</Text>
        <BirthDataForm
          onSubmit={handleSubmitA}
          isLoading={isLoading}
          apiConfig={apiConfig}
          submitLabel="Use this chart"
        />
        {dataA ? (
          <Text style={styles.savedHint}>✓ Chart saved. Enter partner's data below.</Text>
        ) : null}
      </View>

      <View style={[styles.section, styles.partnerSection]}>
        <Text style={styles.sectionTitle}>Partner's birth data</Text>
        <BirthDataForm
          onSubmit={handleSubmitB}
          isLoading={isLoading}
          apiConfig={apiConfig}
          submitLabel="Use this chart"
        />
        {dataB ? <Text style={styles.savedHint}>✓ Partner chart saved.</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.compareButton, (!dataA || !dataB || isLoading) && styles.compareButtonDisabled]}
        onPress={handleCompare}
        disabled={!dataA || !dataB || isLoading}
      >
        <Text style={styles.compareButtonText}>
          {isLoading ? "Comparing..." : "Compare relationship"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  section: {
    marginBottom: 8,
  },
  partnerSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 158, 11, 0.2)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fbbf24",
    marginBottom: 12,
  },
  savedHint: {
    fontSize: 12,
    color: "#fbbf24",
    marginTop: 8,
  },
  compareButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  compareButtonDisabled: {
    opacity: 0.5,
  },
  compareButtonText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
});
