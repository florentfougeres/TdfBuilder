export type StageCategory =
  | "plaine"
  | "accidente"
  | "montagne"
  | "contre-la-montre"
  | "contre-la-montre-equipe";

export const STAGE_CATEGORIES: { value: StageCategory; label: string; color: string }[] = [
  { value: "plaine", label: "Plaine", color: "#f1c40f" },
  { value: "accidente", label: "Accidenté", color: "#e67e22" },
  { value: "montagne", label: "Montagne", color: "#e74c3c" },
  { value: "contre-la-montre", label: "Contre-la-montre", color: "#3498db" },
  { value: "contre-la-montre-equipe", label: "CLM par équipe", color: "#9b59b6" },
];

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  ele: number;
  distKm: number; // cumulative distance from stage start
}

export interface Stage {
  id: string;
  startLocation: string;
  endLocation: string;
  category: StageCategory;
  waypoints: Waypoint[];
  route: RoutePoint[] | null;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  isRouting: boolean;
  routingError: string | null;
}

export interface Tour {
  id: string;
  name: string;
  stages: Stage[];
}

export function stageLabel(stage: Stage, index: number): string {
  const start = (stage.startLocation ?? "").trim();
  const end = (stage.endLocation ?? "").trim();
  if (start && end) return `${start} → ${end}`;
  if (start || end) return start || end;
  return `Étape ${index}`;
}

export function emptyStage(): Stage {
  return {
    id: crypto.randomUUID(),
    startLocation: "",
    endLocation: "",
    category: "plaine",
    waypoints: [],
    route: null,
    distanceKm: 0,
    elevationGainM: 0,
    elevationLossM: 0,
    isRouting: false,
    routingError: null,
  };
}

export function emptyTour(): Tour {
  return {
    id: crypto.randomUUID(),
    name: "Mon Tour",
    stages: [emptyStage()],
  };
}
