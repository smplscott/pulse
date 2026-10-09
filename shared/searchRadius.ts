export const DEFAULT_RADIUS_KM = 50;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 250;
export const RADIUS_KM_PRESETS = [25, 50, 100, 150, 250] as const;
export const RADIUS_MI_PRESETS = [15, 30, 60, 90, 155] as const;

export type DistanceUnit = "km" | "mi";

export function clampRadiusKm(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return DEFAULT_RADIUS_KM;
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(n)));
}

export function kmToMiles(km: number): number {
  return Math.round(clampRadiusKm(km) / 1.609344);
}

export function milesToKm(miles: number): number {
  const n = typeof miles === "number" ? miles : parseInt(String(miles ?? ""), 10);
  if (!Number.isFinite(n)) return DEFAULT_RADIUS_KM;
  return clampRadiusKm(n * 1.609344);
}

export function nearestPreset(value: number, presets: readonly number[]): number {
  return presets.reduce((best, preset) =>
    Math.abs(preset - value) < Math.abs(best - value) ? preset : best,
  );
}

export function formatRadius(km: number, unit: DistanceUnit): string {
  const safe = clampRadiusKm(km);
  return unit === "mi" ? `${kmToMiles(safe)} mi` : `${safe} km`;
}
