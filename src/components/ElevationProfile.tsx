import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTourStore } from "../store";
import { STAGE_CATEGORIES } from "../types";

const MAX_POINTS = 400;

export default function ElevationProfile() {
  const tour = useTourStore((s) => s.tour);
  const activeStageId = useTourStore((s) => s.activeStageId);
  const activeStage = tour.stages.find((s) => s.id === activeStageId);
  const catColor = activeStage
    ? STAGE_CATEGORIES.find((c) => c.value === activeStage.category)?.color ?? "#3498db"
    : "#3498db";

  const data = useMemo(() => {
    if (!activeStage?.route || activeStage.route.length === 0) return [];
    const route = activeStage.route;
    const step = Math.max(1, Math.floor(route.length / MAX_POINTS));
    const sampled = [];
    for (let i = 0; i < route.length; i += step) {
      sampled.push({ km: Number(route[i].distKm.toFixed(2)), ele: Math.round(route[i].ele) });
    }
    const last = route[route.length - 1];
    sampled.push({ km: Number(last.distKm.toFixed(2)), ele: Math.round(last.ele) });
    return sampled;
  }, [activeStage]);

  if (!activeStage || data.length === 0) {
    return (
      <div className="elevation-profile empty">
        <p>Aucun profil à afficher — tracez une étape avec au moins 2 points.</p>
      </div>
    );
  }

  return (
    <div className="elevation-profile">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="eleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={catColor} stopOpacity={0.6} />
              <stop offset="95%" stopColor={catColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="km" unit=" km" tick={{ fontSize: 11 }} />
          <YAxis unit=" m" tick={{ fontSize: 11 }} width={55} domain={["dataMin - 20", "dataMax + 20"]} />
          <Tooltip
            formatter={(value) => [`${value} m`, "Altitude"]}
            labelFormatter={(label) => `${label} km`}
          />
          <Area type="monotone" dataKey="ele" stroke={catColor} strokeWidth={2} fill="url(#eleFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
