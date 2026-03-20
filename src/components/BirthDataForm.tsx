"use client";

import { useState, useCallback } from "react";

export interface BirthDataFormProps {
  onSubmit: (data: {
    date: string;
    time: string;
    location: string;
    lat?: number;
    lng?: number;
  }) => void;
  isLoading?: boolean;
}

export function BirthDataForm({ onSubmit, isLoading }: BirthDataFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocode = useCallback(async () => {
    if (!location.trim() || location.trim().length < 2) {
      setLocationError("Enter a city or location (min 2 characters)");
      return null;
    }

    setIsGeocoding(true);
    setLocationError("");

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(location.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setLocationError(data.error || "Location not found");
        return null;
      }

      return { lat: data.lat, lng: data.lng };
    } catch {
      setLocationError("Failed to geocode location");
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time || !location.trim()) {
      setLocationError("All fields are required");
      return;
    }

    const coords = await handleGeocode();
    if (location.trim().length < 2) return;

    onSubmit({
      date,
      time,
      location: location.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-left"
    >
      <div>
        <label
          htmlFor="birth-date"
          className="block text-sm font-medium text-amber-100/90 mb-1.5"
        >
          Birth Date
        </label>
        <input
          id="birth-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="birth-time"
          className="block text-sm font-medium text-amber-100/90 mb-1.5"
        >
          Birth Time
        </label>
        <input
          id="birth-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-amber-200/60">
          Use local time at birth. If unknown, noon is often used.
        </p>
      </div>

      <div>
        <label
          htmlFor="birth-location"
          className="block text-sm font-medium text-amber-100/90 mb-1.5"
        >
          Birth Location
        </label>
        <input
          id="birth-location"
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setLocationError("");
          }}
          placeholder="e.g. New York, NY or London, UK"
          required
          className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
          disabled={isLoading}
        />
        {locationError && (
          <p className="mt-1 text-xs text-amber-400">{locationError}</p>
        )}
        <p className="mt-1 text-xs text-amber-200/60">
          City and country for accurate house placement.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || isGeocoding}
        className="mt-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        {isLoading ? "Calculating..." : isGeocoding ? "Finding location..." : "Get your daily horoscope"}
      </button>
    </form>
  );
}
