import type { RoutePoint, Stage, Tour } from "../types";

const hasFileSystemAccess = typeof (window as any).showSaveFilePicker === "function";

export async function saveTourToFile(tour: Tour): Promise<void> {
  const json = JSON.stringify(tour, null, 2);
  const filename = `${slugify(tour.name)}.json`;

  if (hasFileSystemAccess) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Tour JSON", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      // fall through to download fallback
    }
  }
  downloadBlob(json, filename, "application/json");
}

export async function loadTourFromFile(): Promise<Tour | null> {
  if (hasFileSystemAccess) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: "Tour JSON", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      const text = await file.text();
      return JSON.parse(text) as Tour;
    } catch (err: any) {
      if (err?.name === "AbortError") return null;
      throw err;
    }
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(JSON.parse(text) as Tour);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

export function exportStageGpx(label: string, stage: Stage): void {
  if (!stage.route || stage.route.length === 0) return;
  const gpx = buildGpx(label, stage.route);
  downloadBlob(gpx, `${slugify(label)}.gpx`, "application/gpx+xml");
}

function buildGpx(name: string, route: RoutePoint[]): string {
  const points = route
    .map((p) => `      <trkpt lat="${p.lat}" lon="${p.lng}"><ele>${p.ele.toFixed(1)}</ele></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TdfBuilder" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "tour";
}
