/**
 * Geocode a location string to lat/lng using Nominatim (OpenStreetMap)
 * Free, no API key required for reasonable usage
 */
export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const encoded = encodeURIComponent(location);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "HoroscopeApp/1.0",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name || location,
    };
  } catch {
    return null;
  }
}
