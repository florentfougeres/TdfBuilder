import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useTourStore } from "../store";
import { STAGE_CATEGORIES } from "../types";

const FRANCE_CENTER: [number, number] = [46.6, 2.4];

function numberedIcon(n: number, isFirst: boolean, isLast: boolean) {
  const bg = isFirst ? "#2ecc71" : isLast ? "#e74c3c" : "#2c3e50";
  return L.divIcon({
    className: "waypoint-icon",
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function ClickHandler() {
  const activeStageId = useTourStore((s) => s.activeStageId);
  const addWaypoint = useTourStore((s) => s.addWaypoint);
  useMapEvents({
    click(e) {
      addWaypoint(activeStageId, { lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView() {
  const tour = useTourStore((s) => s.tour);
  const activeStageId = useTourStore((s) => s.activeStageId);
  const moveWaypoint = useTourStore((s) => s.moveWaypoint);
  const removeWaypoint = useTourStore((s) => s.removeWaypoint);

  const activeStage = tour.stages.find((s) => s.id === activeStageId);
  const categoryColor = useMemo(() => {
    const map: Record<string, string> = {};
    STAGE_CATEGORIES.forEach((c) => (map[c.value] = c.color));
    return map;
  }, []);

  return (
    <MapContainer center={FRANCE_CENTER} zoom={6} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler />

      {tour.stages.map((stage) => {
        if (!stage.route || stage.route.length < 2) return null;
        const positions = stage.route.map((p) => [p.lat, p.lng] as [number, number]);
        const isActive = stage.id === activeStageId;
        return (
          <Polyline
            key={stage.id}
            positions={positions}
            pathOptions={{
              color: isActive ? categoryColor[stage.category] : "#999",
              weight: isActive ? 5 : 2,
              opacity: isActive ? 0.9 : 0.4,
            }}
          />
        );
      })}

      {activeStage &&
        activeStage.waypoints.map((wp, idx) => (
          <Marker
            key={wp.id}
            position={[wp.lat, wp.lng]}
            draggable
            icon={numberedIcon(idx + 1, idx === 0, idx === activeStage.waypoints.length - 1)}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                moveWaypoint(activeStage.id, wp.id, pos.lat, pos.lng);
              },
            }}
          >
            <Popup>
              <div style={{ fontSize: 13 }}>
                Point {idx + 1}
                <br />
                <button onClick={() => removeWaypoint(activeStage.id, wp.id)}>Supprimer</button>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
