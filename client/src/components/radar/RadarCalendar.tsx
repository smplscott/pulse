import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserTravelPlan, WishlistEventMatch } from "@shared/schema";

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1));
}

export default function RadarCalendar({
  trips,
  matches,
  startDate,
  endDate,
  onChange,
}: {
  trips: UserTravelPlan[];
  matches: WishlistEventMatch[];
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const days = useMemo(() => {
    const first = startOfMonth(cursor.year, cursor.month);
    const startWeekday = first.getUTCDay();
    const grid: Date[] = [];
    const begin = new Date(first);
    begin.setUTCDate(1 - startWeekday);
    for (let i = 0; i < 42; i++) {
      const day = new Date(begin);
      day.setUTCDate(begin.getUTCDate() + i);
      grid.push(day);
    }
    return grid;
  }, [cursor]);

  const tripDays = useMemo(() => {
    const set = new Set<string>();
    for (const trip of trips) {
      if (trip.kind === "always_on" || !trip.startDate || !trip.endDate) continue;
      let cursorDate = new Date(`${trip.startDate}T00:00:00Z`);
      const end = new Date(`${trip.endDate}T00:00:00Z`);
      while (cursorDate <= end) {
        set.add(iso(cursorDate));
        cursorDate.setUTCDate(cursorDate.getUTCDate() + 1);
      }
    }
    return set;
  }, [trips]);

  const matchDays = useMemo(() => {
    const set = new Set<string>();
    for (const match of matches) {
      if (!match.eventStartAt) continue;
      set.add(new Date(match.eventStartAt).toISOString().slice(0, 10));
    }
    return set;
  }, [matches]);

  function pick(day: string) {
    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: day, endDate: "" });
      return;
    }
    if (day < startDate) {
      onChange({ startDate: day, endDate: startDate });
      return;
    }
    onChange({ startDate, endDate: day });
  }

  const label = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="rounded-xl border border-[#333] bg-[#111] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(current => current.month === 0
            ? { year: current.year - 1, month: 11 }
            : { year: current.year, month: current.month - 1 })}
          className="rounded-lg p-1 text-[#888] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-white">{label}</p>
        <button
          type="button"
          onClick={() => setCursor(current => current.month === 11
            ? { year: current.year + 1, month: 0 }
            : { year: current.year, month: current.month + 1 })}
          className="rounded-lg p-1 text-[#888] hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#666]">
        {["S", "M", "T", "W", "T", "F", "S"].map(day => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map(day => {
          const key = iso(day);
          const inMonth = day.getUTCMonth() === cursor.month;
          const selected = startDate && key >= startDate && (!endDate || key <= endDate);
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              className={cn(
                "relative h-8 rounded-md text-xs",
                inMonth ? "text-white" : "text-[#444]",
                selected && "bg-[#c2f970]/25 text-[#c2f970]",
                tripDays.has(key) && !selected && "bg-[#222]",
              )}
            >
              {day.getUTCDate()}
              {matchDays.has(key) && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#ff6fae]" />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-[#555]">Tap a start day, then an end day. Pink dots are matches.</p>
    </div>
  );
}
