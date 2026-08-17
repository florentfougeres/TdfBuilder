import { useTourStore } from "../store";
import { STAGE_CATEGORIES } from "../types";
import LocationAutocomplete from "./LocationAutocomplete";

export default function StageList() {
  const tour = useTourStore((s) => s.tour);
  const activeStageId = useTourStore((s) => s.activeStageId);
  const setActiveStage = useTourStore((s) => s.setActiveStage);
  const addStage = useTourStore((s) => s.addStage);
  const removeStage = useTourStore((s) => s.removeStage);
  const reorderStages = useTourStore((s) => s.reorderStages);
  const setStageStartLocation = useTourStore((s) => s.setStageStartLocation);
  const setStageEndLocation = useTourStore((s) => s.setStageEndLocation);
  const setStageStartPlace = useTourStore((s) => s.setStageStartPlace);
  const setStageEndPlace = useTourStore((s) => s.setStageEndPlace);
  const setStageCategory = useTourStore((s) => s.setStageCategory);

  return (
    <div className="stage-list">
      <div className="stage-list-header">
        <h2>Étapes ({tour.stages.length})</h2>
        <button onClick={addStage}>+ Étape</button>
      </div>
      <div className="stage-list-items">
        {tour.stages.map((stage, idx) => {
          const cat = STAGE_CATEGORIES.find((c) => c.value === stage.category)!;
          const isActive = stage.id === activeStageId;
          return (
            <div
              key={stage.id}
              className={`stage-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveStage(stage.id)}
              style={{ borderLeftColor: cat.color }}
            >
              <div className="stage-item-top">
                <span className="stage-index">{idx + 1}</span>
                <LocationAutocomplete
                  value={stage.startLocation}
                  placeholder="Départ"
                  onTextChange={(text) => setStageStartLocation(stage.id, text)}
                  onSelect={(place) => setStageStartPlace(stage.id, place)}
                />
                <span className="stage-arrow">→</span>
                <LocationAutocomplete
                  value={stage.endLocation}
                  placeholder="Arrivée"
                  onTextChange={(text) => setStageEndLocation(stage.id, text)}
                  onSelect={(place) => setStageEndPlace(stage.id, place)}
                />
              </div>
              <div className="stage-item-controls" onClick={(e) => e.stopPropagation()}>
                <select
                  value={stage.category}
                  onChange={(e) => setStageCategory(stage.id, e.target.value as any)}
                  style={{ borderColor: cat.color }}
                >
                  {STAGE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button disabled={idx === 0} onClick={() => reorderStages(idx, idx - 1)} title="Monter">
                  ↑
                </button>
                <button
                  disabled={idx === tour.stages.length - 1}
                  onClick={() => reorderStages(idx, idx + 1)}
                  title="Descendre"
                >
                  ↓
                </button>
                <button
                  onClick={() => {
                    if (tour.stages.length > 1) removeStage(stage.id);
                  }}
                  disabled={tour.stages.length <= 1}
                  title="Supprimer"
                  className="danger"
                >
                  ✕
                </button>
              </div>
              <div className="stage-item-stats">
                {stage.isRouting ? (
                  <span className="routing-badge">calcul…</span>
                ) : stage.routingError ? (
                  <span className="error-badge" title={stage.routingError}>
                    erreur
                  </span>
                ) : (
                  <>
                    <span>{stage.distanceKm.toFixed(1)} km</span>
                    <span>D+ {Math.round(stage.elevationGainM)} m</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
