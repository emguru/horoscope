import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { geocodeLocation, type ApiConfig } from "./api";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}
function formatTime(d: Date) {
  return d.toTimeString().slice(0, 5);
}

interface BirthDataFormProps {
  onSubmit: (data: {
    date: string;
    time: string;
    location: string;
    lat?: number;
    lng?: number;
  }) => void;
  isLoading?: boolean;
  apiConfig: ApiConfig;
  submitLabel?: string;
}

export function BirthDataForm({ onSubmit, isLoading, apiConfig, submitLabel }: BirthDataFormProps) {
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [timeValue, setTimeValue] = useState(new Date(2000, 0, 1, 12, 0));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const date = dateValue ? formatDate(dateValue) : "";
  const time = formatTime(timeValue);

  const handleGeocode = useCallback(async () => {
    if (!location.trim() || location.trim().length < 2) {
      setLocationError("Enter a city or location (min 2 characters)");
      return null;
    }
    setIsGeocoding(true);
    setLocationError("");
    try {
      const coords = await geocodeLocation(location.trim());
      return coords;
    } catch {
      setLocationError("Failed to geocode location");
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [location, apiConfig]);

  const handleSubmit = async () => {
    if (!dateValue || !location.trim()) {
      setLocationError("All fields are required");
      return;
    }
    if (location.trim().length < 2) return;

    const coords = await handleGeocode();
    onSubmit({
      date,
      time,
      location: location.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
    });
  };

  const isDisabled = isLoading || isGeocoding;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.form}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => !isDisabled && setShowDatePicker(true)}
            disabled={isDisabled}
          >
            <Text style={date ? styles.inputText : styles.placeholder}>
              {date || "Tap to select date"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateValue || new Date(1990, 0, 1)}
              mode="date"
              display={Platform.OS === "android" ? "calendar" : "spinner"}
              onChange={(_, d) => {
                setShowDatePicker(Platform.OS === "ios");
                if (d) setDateValue(d);
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Birth Time</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => !isDisabled && setShowTimePicker(true)}
            disabled={isDisabled}
          >
            <Text style={styles.inputText}>{time}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={timeValue}
              mode="time"
              display={Platform.OS === "android" ? "default" : "spinner"}
              onChange={(_, d) => {
                setShowTimePicker(Platform.OS === "ios");
                if (d) setTimeValue(d);
              }}
            />
          )}
          <Text style={styles.hint}>Use local time at birth. If unknown, noon is often used.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Birth Location</Text>
          <TextInput
            style={[styles.input, styles.inputTextInput]}
            value={location}
            onChangeText={(t) => {
              setLocation(t);
              setLocationError("");
            }}
            placeholder="e.g. New York, NY or London, UK"
            placeholderTextColor="#fcd34d80"
            editable={!isDisabled}
          />
          {locationError ? (
            <Text style={styles.error}>{locationError}</Text>
          ) : null}
          <Text style={styles.hint}>City and country for accurate house placement.</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color="#0f172a" />
          ) : isGeocoding ? (
            <Text style={styles.buttonText}>Finding location...</Text>
          ) : (
            <Text style={styles.buttonText}>{submitLabel ?? "Get your daily horoscope"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fef3c7",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    justifyContent: "center",
  },
  inputTextInput: {
    color: "#ffffff",
  },
  inputText: {
    fontSize: 16,
    color: "#fefce8",
  },
  placeholder: {
    fontSize: 16,
    color: "#fcd34d80",
  },
  hint: {
    fontSize: 12,
    color: "#fde68a99",
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: "#fbbf24",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
});
