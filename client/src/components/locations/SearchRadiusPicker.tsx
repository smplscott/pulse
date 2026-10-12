import { ChevronDown, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  /** Signup hometown keeps the full inline picker. Everywhere else uses a compact popover. */
  variant?: "inline" | "popover";
  compact?: boolean;
}

function RadiusOptions({
  valueKm,
  onChange,
}: {
  valueKm: number;
  onChange: (radiusKm: number) => void;
}) {
  const { unit, setUnit } = useDistanceUnit();
  const safeKm = clampRadiusKm(valueKm);
  const presets = unit === "mi" ? RADIUS_MI_PRESETS : RADIUS_KM_PRESETS;
  const selected = unit === "mi"
    ? nearestPreset(Math.round(safeKm / 1.609344), RADIUS_MI_PRESETS)
    : nearestPreset(safeKm, RADIUS_KM_PRESETS);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666]">
          Search radius
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

export default function SearchRadiusPicker({
  valueKm,
  onChange,
  className,
  variant,
  compact,
}: Props) {
  const { unit } = useDistanceUnit();
  const safeKm = clampRadiusKm(valueKm);
  const mode = variant ?? (compact === false ? "inline" : "popover");

  if (mode === "inline") {
    return (
      <div className={cn("space-y-2", className)}>
        <RadiusOptions valueKm={valueKm} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-end", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-[#333] bg-[#1b1b1b] px-2.5 py-1 text-[11px] font-semibold text-[#c2f970] hover:border-[#c2f970]/40"
            aria-label={`Search radius ${formatRadius(safeKm, unit)}. Change radius`}
          >
            <MapPin className="h-3 w-3" />
            {formatRadius(safeKm, unit)}
            <ChevronDown className="h-3 w-3 text-[#888]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={6}
          className="w-64 border-[#333] bg-[#161616] p-3 text-white shadow-xl"
        >
          <RadiusOptions valueKm={valueKm} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
