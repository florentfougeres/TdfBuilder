import { useTourStore } from "../store";
import { STAGE_CATEGORIES, stageLabel } from "../types";

export default function StatsPanel() {
  const tour = useTourStore((s) => s.tour);
  const activeStageId = useTourStore((s) => s.activeStageId);

  const totalDistance = tour.stages.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalGain = tour.stages.reduce((sum, s) => sum + s.elevationGainM, 0);
  const totalLoss = tour.stages.reduce((sum, s) => sum + s.elevationLossM, 0);

  const activeStageIdx = tour.stages.findIndex((s) => s.id === activeStageId);
  const activeStage = tour.stages[activeStageIdx];
  const activeCat = activeStage ? STAGE_CATEGORIES.find((c) => c.value === activeStage.category) : null;

  return (
    <div className="stats-panel">
      <div className="stats-block">
        <h3>Tour complet</h3>
        <div className="stats-grid">
          <div className="stat">
            <span className="stat-value">{totalDistance.toFixed(1)}</span>
            <span className="stat-label">km</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(totalGain).toLocaleString("fr-FR")}</span>
            <span className="stat-label">m D+</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(totalLoss).toLocaleString("fr-FR")}</span>
            <span className="stat-label">m D-</span>
          </div>
          <div className="stat">
            <span className="stat-value">{tour.stages.length}</span>
            <span className="stat-label">étapes</span>
          </div>
        </div>
      </div>

      {activeStage && (
        <div className="stats-block">
          <h3>
            {stageLabel(activeStage, activeStageIdx + 1)}
            {activeCat && (
              <span className="category-pill" style={{ background: activeCat.color }}>
                {activeCat.label}
              </span>
            )}
          </h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{activeStage.distanceKm.toFixed(1)}</span>
              <span className="stat-label">km</span>
            </div>
            <div className="stat">
              <span className="stat-value">{Math.round(activeStage.elevationGainM)}</span>
              <span className="stat-label">m D+</span>
            </div>
            <div className="stat">
              <span className="stat-value">{Math.round(activeStage.elevationLossM)}</span>
              <span className="stat-label">m D-</span>
            </div>
            <div className="stat">
              <span className="stat-value">{activeStage.waypoints.length}</span>
              <span className="stat-label">points</span>
            </div>
          </div>
          {activeStage.isRouting && <p className="hint">Calcul de l'itinéraire en cours…</p>}
          {activeStage.routingError && <p className="hint error">{activeStage.routingError}</p>}
          {!activeStage.isRouting && activeStage.waypoints.length < 2 && (
            <p className="hint">Cliquez sur la carte pour placer au moins 2 points.</p>
          )}
        </div>
      )}
    </div>
  );
}
