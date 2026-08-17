const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = `${NOMINATIM_URL}?format=json&limit=5&countrycodes=fr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];

  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
}
