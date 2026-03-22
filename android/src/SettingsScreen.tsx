import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAppConfig } from "./AppConfig";
import { geocodeLocation } from "./api";
import type { PronounOption, StoredBirthData } from "./types";

interface SettingsScreenProps {
  onClose: () => void;
}

const emptyBirth: StoredBirthData = { name: "", date: "", time: "12:00", location: "" };

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { config, setConfig, saveConfig } = useAppConfig();
  const [freeAstroKey, setFreeAstroKey] = useState(config.freeAstroKey);
  const [openaiKey, setOpenaiKey] = useState(config.openaiKey);
  const [pronoun, setPronoun] = useState<PronounOption>(config.pronoun);
  const [myBirthData, setMyBirthData] = useState<StoredBirthData>(
    config.myBirthData ?? { ...emptyBirth }
  );
  const [partnerBirthData, setPartnerBirthData] = useState<StoredBirthData>(
    config.partnerBirthData ?? { ...emptyBirth }
  );
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    setFreeAstroKey(config.freeAstroKey);
    setOpenaiKey(config.openaiKey);
    setPronoun(config.pronoun);
    setMyBirthData(config.myBirthData ?? { ...emptyBirth });
    setPartnerBirthData(config.partnerBirthData ?? { ...emptyBirth });
  }, [config]);

  const resolveLocations = async () => {
    setIsResolving(true);
    try {
      if (myBirthData.location.trim().length >= 2) {
        const coords = await geocodeLocation(myBirthData.location.trim());
        if (coords) setMyBirthData((p) => ({ ...p, ...coords }));
      }
      if (partnerBirthData.location.trim().length >= 2) {
        const coords = await geocodeLocation(partnerBirthData.location.trim());
        if (coords) setPartnerBirthData((p) => ({ ...p, ...coords }));
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleSave = async () => {
    setConfig({
      freeAstroKey: freeAstroKey.trim(),
      openaiKey: openaiKey.trim(),
      pronoun,
      myBirthData,
      partnerBirthData,
    });
    await saveConfig();
    Alert.alert("Saved", "Settings saved successfully.");
    onClose();
  };

  const renderBirthSection = (
    title: string,
    data: StoredBirthData,
    onChange: (d: StoredBirthData) => void
  ) => (
    <View style={styles.birthSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={data.name}
        onChangeText={(t) => onChange({ ...data, name: t })}
        placeholder="Your name or nickname"
        placeholderTextColor="#fcd34d80"
      />
      <Text style={styles.label}>Birth Date</Text>
      <TextInput
        style={styles.input}
        value={data.date}
        onChangeText={(t) => onChange({ ...data, date: t })}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#fcd34d80"
      />
      <Text style={styles.label}>Birth Time</Text>
      <TextInput
        style={styles.input}
        value={data.time}
        onChangeText={(t) => onChange({ ...data, time: t })}
        placeholder="HH:mm (24h)"
        placeholderTextColor="#fcd34d80"
      />
      <Text style={styles.label}>Birth Location</Text>
      <TextInput
        style={styles.input}
        value={data.location}
        onChangeText={(t) => onChange({ ...data, location: t })}
        placeholder="e.g. New York, NY"
        placeholderTextColor="#fcd34d80"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionHeader}>My info (for &quot;Me&quot;)</Text>
      {renderBirthSection("", myBirthData, setMyBirthData)}

      <Text style={styles.sectionHeader}>Partner&apos;s info (for &quot;Us&quot;)</Text>
      {renderBirthSection("", partnerBirthData, setPartnerBirthData)}

      <TouchableOpacity
        style={[styles.resolveButton, isResolving && styles.resolveButtonDisabled]}
        onPress={resolveLocations}
        disabled={isResolving}
      >
        {isResolving ? (
          <ActivityIndicator size="small" color="#0f172a" />
        ) : (
          <Text style={styles.resolveButtonText}>Resolve locations</Text>
        )}
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.label}>OpenAI API Key (required for readings)</Text>
        <TextInput
          style={styles.input}
          value={openaiKey}
          onChangeText={setOpenaiKey}
          placeholder="sk-... from platform.openai.com"
          placeholderTextColor="#fcd34d80"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>FreeAstro API Key (optional)</Text>
        <TextInput
          style={styles.input}
          value={freeAstroKey}
          onChangeText={setFreeAstroKey}
          placeholder="Get free at freeastroapi.com"
          placeholderTextColor="#fcd34d80"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Pronouns (for readings)</Text>
        <View style={styles.pronounRow}>
          {(["prefer-not-to-say", "he", "she", "they"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.pronounBtn,
                pronoun === p && styles.pronounBtnActive,
                { marginRight: p !== "they" ? 8 : 0 },
              ]}
              onPress={() => setPronoun(p)}
            >
              <Text style={[styles.pronounBtnText, pronoun === p && styles.pronounBtnTextActive]}>
                {p === "prefer-not-to-say" ? "—" : p === "he" ? "He" : p === "she" ? "She" : "They"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.dedication}>
        <Text style={styles.dedicationText}>Dedicated to Dhru</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#fefce8", marginBottom: 24 },
  sectionHeader: { fontSize: 14, fontWeight: "600", color: "#fcd34d", marginBottom: 8 },
  birthSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#fcd34d", marginBottom: 8 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "500", color: "#fef3c7", marginBottom: 8 },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#fefce8",
    marginBottom: 12,
  },
  resolveButton: {
    backgroundColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  resolveButtonDisabled: { opacity: 0.7 },
  resolveButtonText: { color: "#fde68a", fontSize: 14, fontWeight: "500" },
  saveButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#0f172a", fontWeight: "600", fontSize: 16 },
  pronounRow: { flexDirection: "row", marginBottom: 6 },
  pronounBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    alignItems: "center",
  },
  pronounBtnActive: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  pronounBtnText: { color: "#fde68a", fontSize: 14 },
  pronounBtnTextActive: { color: "#fefce8", fontWeight: "600" },
  cancelButton: { padding: 16, alignItems: "center", marginTop: 8 },
  cancelButtonText: { color: "#fde68a", fontSize: 16 },
  dedication: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    marginBottom: 24,
  },
  dedicationText: { fontSize: 12, color: "rgba(253, 230, 138, 0.6)" },
});
