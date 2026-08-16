import type { RoutePoint, Waypoint } from "../types";

const BROUTER_URL = "https://brouter.de/brouter";
const PROFILE = "fastbike"; // route pavée, profil vélo rapide (proche vélo de route)
const ELEVATION_NOISE_THRESHOLD_M = 2; // ignore le bruit SRTM sous ce seuil

export class RoutingError extends Error {}

interface RouteResult {
  route: RoutePoint[];
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
}

export async function computeRoute(waypoints: Waypoint[]): Promise<RouteResult> {
  if (waypoints.length < 2) {
    return { route: [], distanceKm: 0, elevationGainM: 0, elevationLossM: 0 };
  }

  const lonlats = waypoints.map((w) => `${w.lng},${w.lat}`).join("|");
  const url = `${BROUTER_URL}?lonlats=${lonlats}&profile=${PROFILE}&alternativeidx=0&format=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new RoutingError(`BRouter a échoué (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature) {
    throw new RoutingError("Réponse BRouter invalide (pas d'itinéraire trouvé)");
  }

  const coords: [number, number, number][] = feature.geometry.coordinates;
  const route: RoutePoint[] = [];
  let distKm = 0;
  let gain = 0;
  let loss = 0;
  let lastEle = coords[0]?.[2] ?? 0;

  for (let i = 0; i < coords.length; i++) {
    const [lng, lat, ele] = coords[i];
    if (i > 0) {
      const [plng, plat] = coords[i - 1];
      distKm += haversineKm(plat, plng, lat, lng);
      const diff = ele - lastEle;
      if (Math.abs(diff) >= ELEVATION_NOISE_THRESHOLD_M) {
        if (diff > 0) gain += diff;
        else loss += -diff;
        lastEle = ele;
      }
    }
    route.push({ lat, lng, ele, distKm });
  }

  return { route, distanceKm: distKm, elevationGainM: gain, elevationLossM: loss };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
