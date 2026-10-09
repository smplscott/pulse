import { useEffect, useState } from "react";
import type { DistanceUnit } from "@shared/searchRadius";

const STORAGE_KEY = "pulse.distanceUnit";
const listeners = new Set<(unit: DistanceUnit) => void>();

function readUnit(): DistanceUnit {
  if (typeof window === "undefined") return "km";
  return window.localStorage.getItem(STORAGE_KEY) === "mi" ? "mi" : "km";
}

export function useDistanceUnit() {
  const [unit, setUnitState] = useState<DistanceUnit>(readUnit);

  useEffect(() => {
    listeners.add(setUnitState);
    return () => {
      listeners.delete(setUnitState);
    };
  }, []);

  function setUnit(next: DistanceUnit) {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach(listener => listener(next));
  }

  return { unit, setUnit };
}
