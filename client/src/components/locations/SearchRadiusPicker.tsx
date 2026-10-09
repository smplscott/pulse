import { cn } from "@/lib/utils";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import {
  RADIUS_KM_PRESETS,
  RADIUS_MI_PRESETS,
  clampRadiusKm,
  formatRadius,
  milesToKm,
  nearestPreset,
} from "@shared/searchRadius";

interface Props {
  valueKm: number;
  onChange: (radiusKm: number) => void;
  className?: string;
  compact?: boolean;
}

export default function SearchRadiusPicker({ valueKm, onChange, className, compact }: Props) {
  const { unit, setUnit } = useDistanceUnit();
  const safeKm = clampRadiusKm(valueKm);
  const presets = unit === "mi" ? RADIUS_MI_PRESETS : RADIUS_KM_PRESETS;
  const selected = unit === "mi"
    ? nearestPreset(Math.round(safeKm / 1.609344), RADIUS_MI_PRESETS)
    : nearestPreset(safeKm, RADIUS_KM_PRESETS);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666]">
          {compact ? formatRadius(safeKm, unit) : "Search radius"}
        </p>
        <div className="flex rounded-full bg-[#202020] p-0.5">
          {(["km", "mi"] as const).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setUnit(option)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                unit === option ? "bg-[#c2f970] text-black" : "text-[#777]",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(unit === "mi" ? milesToKm(preset) : preset)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              selected === preset ? "bg-[#c2f970] text-black" : "bg-[#222] text-[#888]",
            )}
          >
            {preset}{unit === "mi" ? " mi" : " km"}
          </button>
        ))}
      </div>
    </div>
  );
}
