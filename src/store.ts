import { create } from "zustand";
import type { Stage, StageCategory, Tour, Waypoint } from "./types";
import { emptyStage, emptyTour } from "./types";
import { computeRoute, RoutingError } from "./services/routing";

interface TourState {
  tour: Tour;
  activeStageId: string;

  setTour: (tour: Tour) => void;
  newTour: () => void;
  setTourName: (name: string) => void;

  addStage: () => void;
  removeStage: (stageId: string) => void;
  reorderStages: (fromIndex: number, toIndex: number) => void;
  setStageStartLocation: (stageId: string, startLocation: string) => void;
  setStageEndLocation: (stageId: string, endLocation: string) => void;
  setStageStartPlace: (stageId: string, place: { label: string; lat: number; lng: number }) => void;
  setStageEndPlace: (stageId: string, place: { label: string; lat: number; lng: number }) => void;
  setStageCategory: (stageId: string, category: StageCategory) => void;
  setActiveStage: (stageId: string) => void;

  addWaypoint: (stageId: string, wp: { lat: number; lng: number }) => void;
  insertWaypoint: (stageId: string, index: number, wp: { lat: number; lng: number }) => void;
  moveWaypoint: (stageId: string, waypointId: string, lat: number, lng: number) => void;
  removeWaypoint: (stageId: string, waypointId: string) => void;
}

function updateStage(stages: Stage[], stageId: string, patch: Partial<Stage>): Stage[] {
  return stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s));
}

async function triggerRouting(get: () => TourState, set: (fn: (s: TourState) => Partial<TourState>) => void, stageId: string) {
  const stage = get().tour.stages.find((s) => s.id === stageId);
  if (!stage) return;

  if (stage.waypoints.length < 2) {
    set((s) => ({
      tour: {
        ...s.tour,
        stages: updateStage(s.tour.stages, stageId, {
          route: null,
          distanceKm: 0,
          elevationGainM: 0,
          elevationLossM: 0,
          isRouting: false,
          routingError: null,
        }),
      },
    }));
    return;
  }

  set((s) => ({
    tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { isRouting: true, routingError: null }) },
  }));

  try {
    const result = await computeRoute(stage.waypoints);
    set((s) => ({
      tour: {
        ...s.tour,
        stages: updateStage(s.tour.stages, stageId, {
          route: result.route,
          distanceKm: result.distanceKm,
          elevationGainM: result.elevationGainM,
          elevationLossM: result.elevationLossM,
          isRouting: false,
          routingError: null,
        }),
      },
    }));
  } catch (err) {
    const msg = err instanceof RoutingError ? err.message : "Erreur de calcul d'itinéraire";
    set((s) => ({
      tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { isRouting: false, routingError: msg }) },
    }));
  }
}

const initialTour = emptyTour();

export const useTourStore = create<TourState>((set, get) => ({
  tour: initialTour,
  activeStageId: initialTour.stages[0]?.id ?? "",

  setTour: (tour) => set({ tour, activeStageId: tour.stages[0]?.id ?? "" }),

  newTour: () => {
    const t = emptyTour();
    set({ tour: t, activeStageId: t.stages[0]?.id ?? "" });
  },

  setTourName: (name) => set((s) => ({ tour: { ...s.tour, name } })),

  addStage: () =>
    set((s) => {
      const stage = emptyStage();
      return { tour: { ...s.tour, stages: [...s.tour.stages, stage] }, activeStageId: stage.id };
    }),

  removeStage: (stageId) =>
    set((s) => {
      const stages = s.tour.stages.filter((st) => st.id !== stageId);
      const activeStageId = s.activeStageId === stageId ? stages[0]?.id ?? "" : s.activeStageId;
      return { tour: { ...s.tour, stages }, activeStageId };
    }),

  reorderStages: (fromIndex, toIndex) =>
    set((s) => {
      const stages = [...s.tour.stages];
      const [moved] = stages.splice(fromIndex, 1);
      stages.splice(toIndex, 0, moved);
      return { tour: { ...s.tour, stages } };
    }),

  setStageStartLocation: (stageId, startLocation) =>
    set((s) => ({ tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { startLocation }) } })),

  setStageEndLocation: (stageId, endLocation) =>
    set((s) => ({ tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { endLocation }) } })),

  setStageStartPlace: (stageId, place) => {
    set((s) => {
      const stage = s.tour.stages.find((st) => st.id === stageId);
      if (!stage) return s;
      const waypoint: Waypoint = { id: crypto.randomUUID(), lat: place.lat, lng: place.lng };
      const waypoints =
        stage.waypoints.length === 0
          ? [waypoint]
          : stage.waypoints.map((w, i) => (i === 0 ? waypoint : w));
      return {
        tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { startLocation: place.label, waypoints }) },
      };
    });
    triggerRouting(get, set, stageId);
  },

  setStageEndPlace: (stageId, place) => {
    set((s) => {
      const stage = s.tour.stages.find((st) => st.id === stageId);
      if (!stage) return s;
      const waypoint: Waypoint = { id: crypto.randomUUID(), lat: place.lat, lng: place.lng };
      const waypoints =
        stage.waypoints.length <= 1
          ? [...stage.waypoints, waypoint]
          : stage.waypoints.map((w, i) => (i === stage.waypoints.length - 1 ? waypoint : w));
      return {
        tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { endLocation: place.label, waypoints }) },
      };
    });
    triggerRouting(get, set, stageId);
  },

  setStageCategory: (stageId, category) =>
    set((s) => ({ tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { category }) } })),

  setActiveStage: (stageId) => set({ activeStageId: stageId }),

  addWaypoint: (stageId, wp) => {
    set((s) => {
      const stage = s.tour.stages.find((st) => st.id === stageId);
      if (!stage) return s;
      const waypoint: Waypoint = { id: crypto.randomUUID(), lat: wp.lat, lng: wp.lng };
      const waypoints = [...stage.waypoints, waypoint];
      return { tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { waypoints }) } };
    });
    triggerRouting(get, set, stageId);
  },

  insertWaypoint: (stageId, index, wp) => {
    set((s) => {
      const stage = s.tour.stages.find((st) => st.id === stageId);
      if (!stage) return s;
      const waypoint: Waypoint = { id: crypto.randomUUID(), lat: wp.lat, lng: wp.lng };
      const waypoints = [...stage.waypoints];
      waypoints.splice(index, 0, waypoint);
      return { tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { waypoints }) } };
    });
    triggerRouting(get, set, stageId);
  },

  moveWaypoint: (stageId, waypointId, lat, lng) => {
    set((s) => {
      const stage = s.tour.stages.find((st) => st.id === stageId);
      if (!stage) return s;
      const waypoints = stage.waypoints.map((w) => (w.id === waypointId ? { ...w, lat, lng } : w));
      return { tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { waypoints }) } };
    });
    triggerRouting(get, set, stageId);
  },

  removeWaypoint: (stageId, waypointId) => {
    set((s) => {
      const stage = s.tour.stages.find((st) => st.id === stageId);
      if (!stage) return s;
      const waypoints = stage.waypoints.filter((w) => w.id !== waypointId);
      return { tour: { ...s.tour, stages: updateStage(s.tour.stages, stageId, { waypoints }) } };
    });
    triggerRouting(get, set, stageId);
  },
}));
