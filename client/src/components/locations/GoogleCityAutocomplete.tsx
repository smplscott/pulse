import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SelectedCity {
  city: string;
  country: string;
  countryCode?: string;
  googlePlaceId?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

interface Suggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
}

interface Props {
  value: SelectedCity;
  onChange: (value: SelectedCity) => void;
  className?: string;
}

function newSessionToken() {
  return crypto.randomUUID();
}

export default function GoogleCityAutocomplete({ value, onChange, className }: Props) {
  const [input, setInput] = useState(value.city);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [open, setOpen] = useState(false);
  const [providerUnavailable, setProviderUnavailable] = useState(false);
  const [manual, setManual] = useState(!value.googlePlaceId);
  const tokenRef = useRef(newSessionToken());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInput(value.city);
    setManual(!value.googlePlaceId);
  }, [value.city, value.googlePlaceId]);

  async function search(query: string) {
    setSearching(true);
    try {
      const response = await fetch("/api/google-places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          input: query,
          mode: "city",
          sessionToken: tokenRef.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setProviderUnavailable(response.status === 503);
        setSuggestions([]);
        return;
      }
      setProviderUnavailable(false);
      setSuggestions(data.results ?? []);
      setOpen(true);
    } catch {
      setProviderUnavailable(true);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  function updateInput(next: string) {
    setInput(next);
    setManual(true);
    onChange({
      city: next,
      country: value.country,
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (next.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(() => search(next.trim()), 350);
  }

  async function selectSuggestion(suggestion: Suggestion) {
    setSelecting(true);
    try {
      const params = new URLSearchParams({
        mode: "city",
        sessionToken: tokenRef.current,
      });
      const response = await fetch(
        `/api/google-places/${encodeURIComponent(suggestion.placeId)}/details?${params}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("City details failed");
      const details = await response.json();
      const next: SelectedCity = {
        city: details.city || suggestion.mainText,
        country: details.country || suggestion.secondaryText,
        countryCode: details.countryCode || undefined,
        googlePlaceId: details.placeId,
        latitude: details.latitude ?? undefined,
        longitude: details.longitude ?? undefined,
        formattedAddress: details.formattedAddress || suggestion.text,
      };
      onChange(next);
      setInput(next.city);
      setManual(false);
      setOpen(false);
      setSuggestions([]);
      tokenRef.current = newSessionToken();
    } catch {
      setProviderUnavailable(true);
      setManual(true);
    } finally {
      setSelecting(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
        <Input
          value={input}
          onChange={event => updateInput(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search for a city…"
          autoComplete="off"
          className="bg-[#202020] pl-9 pr-9 text-white"
        />
        {(searching || selecting) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#c2f970]" />
        )}
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#222] shadow-2xl">
            {suggestions.map(suggestion => (
              <button
                key={suggestion.placeId}
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#303030]"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#c2f970]/10">
                  <MapPin className="h-4 w-4 text-[#c2f970]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{suggestion.mainText}</p>
                  <p className="truncate text-xs text-[#777]">{suggestion.secondaryText}</p>
                </div>
              </button>
            ))}
            <p className="border-t border-[#333] px-3 py-1.5 text-right text-[10px] font-semibold text-[#777]">Powered by Google</p>
          </div>
        )}
      </div>

      {value.googlePlaceId && !manual ? (
        <div className="flex items-center justify-between rounded-lg border border-[#c2f970]/20 bg-[#c2f970]/8 px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-xs text-[#bde87b]">
            <Check className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{value.city}, {value.country}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setManual(true);
              onChange({ city: value.city, country: value.country });
            }}
            className="ml-2 flex-shrink-0 text-[10px] text-[#888] underline"
          >
            Edit manually
          </button>
        </div>
      ) : (
        <Input
          value={value.country}
          onChange={event => onChange({ city: input, country: event.target.value })}
          placeholder="Country"
          className="bg-[#202020] text-white"
        />
      )}

      {providerUnavailable && (
        <p className="text-[10px] text-amber-300/80">
          Google city search is unavailable. Enter the city and country manually.
        </p>
      )}
    </div>
  );
}
