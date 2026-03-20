import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useAppConfig } from "./AppConfig";
import type { PronounOption } from "./types";

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { config, setConfig, saveConfig } = useAppConfig();
  const [freeAstroKey, setFreeAstroKey] = useState(config.freeAstroKey);
  const [openaiKey, setOpenaiKey] = useState(config.openaiKey);
  const [pronoun, setPronoun] = useState<PronounOption>(config.pronoun);

  useEffect(() => {
    setFreeAstroKey(config.freeAstroKey);
    setOpenaiKey(config.openaiKey);
    setPronoun(config.pronoun);
  }, [config]);

  const handleSave = async () => {
    setConfig({
      freeAstroKey: freeAstroKey.trim(),
      openaiKey: openaiKey.trim(),
      pronoun,
    });
    await saveConfig();
    Alert.alert("Saved", "Settings saved successfully.");
    onClose();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

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
        <Text style={styles.hint}>
          Required for daily and synastry readings. Get a key at platform.openai.com. Works on WiFi or mobile data.
        </Text>
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
        <Text style={styles.hint}>
          Optional. For more accurate natal charts. Without it, a simplified chart is used.
        </Text>
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
        <Text style={styles.hint}>Used to personalize reading language.</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fefce8",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fef3c7",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#fefce8",
  },
  hint: {
    fontSize: 12,
    color: "#fde68a99",
    marginTop: 6,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
  pronounRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
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
  pronounBtnText: {
    color: "#fde68a",
    fontSize: 14,
  },
  pronounBtnTextActive: {
    color: "#fefce8",
    fontWeight: "600",
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#fde68a",
    fontSize: 16,
  },
});
