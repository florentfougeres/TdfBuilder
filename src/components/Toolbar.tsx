import { useRef } from "react";
import { useTourStore } from "../store";
import { saveTourToFile, loadTourFromFile, exportStageGpx } from "../services/persistence";
import { stageLabel } from "../types";

export default function Toolbar() {
  const tour = useTourStore((s) => s.tour);
  const activeStageId = useTourStore((s) => s.activeStageId);
  const setTour = useTourStore((s) => s.setTour);
  const setTourName = useTourStore((s) => s.setTourName);
  const newTour = useTourStore((s) => s.newTour);
  const busy = useRef(false);

  const activeStageIdx = tour.stages.findIndex((s) => s.id === activeStageId);
  const activeStage = tour.stages[activeStageIdx];

  const handleSave = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await saveTourToFile(tour);
    } finally {
      busy.current = false;
    }
  };

  const handleLoad = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const loaded = await loadTourFromFile();
      if (loaded) setTour(loaded);
    } catch (err) {
      alert("Impossible de lire ce fichier : " + (err as Error).message);
    } finally {
      busy.current = false;
    }
  };

  const handleNew = () => {
    if (confirm("Créer un nouveau tour ? Les modifications non sauvegardées seront perdues.")) {
      newTour();
    }
  };

  return (
    <div className="toolbar">
      <input
        className="tour-name-input"
        value={tour.name}
        onChange={(e) => setTourName(e.target.value)}
        aria-label="Nom du tour"
      />
      <div className="toolbar-actions">
        <button onClick={handleNew}>Nouveau</button>
        <button onClick={handleLoad}>Ouvrir…</button>
        <button onClick={handleSave}>Sauvegarder</button>
        <button
          onClick={() => activeStage && exportStageGpx(stageLabel(activeStage, activeStageIdx + 1), activeStage)}
          disabled={!activeStage?.route || activeStage.route.length === 0}
        >
          Export GPX étape
        </button>
      </div>
    </div>
  );
}
