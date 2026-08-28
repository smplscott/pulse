/**
 * Unified show search: Ticketmaster (upcoming) + Setlist.fm (past), merged.
 */

import { searchEventsByArtist } from "./ticketmaster";

export interface ShowSearchResult {
  setlistfmId: string;
  artistName: string;
  venueName: string;
  city: string;
  country: string;
  eventDate: string;
  source: "ticketmaster" | "setlistfm";
  url?: string;
}

type SetlistFmSetlist = {
  id: string;
  artist: { name: string };
  venue: { name: string; city: { name: string; country: { name: string } } };
  eventDate: string;
};

const SETLIST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "pulse/1.0 (https://github.com/smplscott/pulse)",
} as const;

function normalizeSetlistDate(eventDate: string): string {
  if (!eventDate) return "";
  const parts = eventDate.split("-");
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return eventDate;
}

function dedupeKey(r: ShowSearchResult): string {
  return [
    r.setlistfmId,
    r.artistName.trim().toLowerCase(),
    r.venueName.trim().toLowerCase(),
    r.eventDate,
  ].join("|");
}

function parseEventDate(iso: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Upcoming first (soonest), then past (most recent). */
function sortShowResults(results: ShowSearchResult[]): ShowSearchResult[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return [...results].sort((a, b) => {
    const aMs = parseEventDate(a.eventDate);
    const bMs = parseEventDate(b.eventDate);
    const aFuture = aMs >= todayMs;
    const bFuture = bMs >= todayMs;

    if (aFuture && bFuture) return aMs - bMs;
    if (aFuture) return -1;
    if (bFuture) return 1;
    return bMs - aMs;
  });
}

function mergeResults(
  tmResults: ShowSearchResult[],
  setlistResults: ShowSearchResult[],
  limit: number,
): ShowSearchResult[] {
  const seen = new Set<string>();
  const merged: ShowSearchResult[] = [];

  // Ticketmaster first — upcoming ticketed events
  for (const r of tmResults) {
    const key = dedupeKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
  }

  // Setlist.fm fills past coverage (and any gaps TM missed)
  for (const r of setlistResults) {
    const key = dedupeKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
  }

  return sortShowResults(merged).slice(0, limit);
}

async function searchSetlistFm(artist: string, apiKey: string): Promise<ShowSearchResult[]> {
  const url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`;
  const response = await fetch(url, {
    headers: { "x-api-key": apiKey, ...SETLIST_HEADERS },
  });
  if (!response.ok) {
    console.warn("[showSearch] Setlist.fm API error", response.status);
    return [];
  }
  const data = await response.json() as { setlist?: SetlistFmSetlist[] };
  return (data.setlist ?? []).map((s) => ({
    setlistfmId: s.id,
    artistName: s.artist?.name ?? artist,
    venueName: s.venue?.name ?? "Unknown Venue",
    city: s.venue?.city?.name ?? "",
    country: s.venue?.city?.country?.name ?? "",
    eventDate: normalizeSetlistDate(s.eventDate),
    source: "setlistfm" as const,
  }));
}

/**
 * Search shows for an artist using both APIs when configured.
 * Ticketmaster covers upcoming events; Setlist.fm adds past concert history.
 */
export async function searchShowsByArtist(artist: string, limit = 20): Promise<{
  results: ShowSearchResult[];
  sources: ("ticketmaster" | "setlistfm")[];
}> {
  const trimmed = artist.trim();
  if (!trimmed) return { results: [], sources: [] };

  const setlistKey = process.env.SETLISTFM_API_KEY;
  const hasTm = !!process.env.TICKETMASTER_API_KEY;

  const [tmResults, setlistResults] = await Promise.all([
    hasTm ? searchEventsByArtist({ keyword: trimmed, size: limit }) : Promise.resolve([]),
    setlistKey ? searchSetlistFm(trimmed, setlistKey).catch((err) => {
      console.warn("[showSearch] Setlist.fm search failed:", err);
      return [];
    }) : Promise.resolve([]),
  ]);

  const sources: ("ticketmaster" | "setlistfm")[] = [];
  if (tmResults.length > 0) sources.push("ticketmaster");
  if (setlistResults.length > 0) sources.push("setlistfm");

  return {
    results: mergeResults(tmResults, setlistResults, limit),
    sources,
  };
}

/** Global search helper — returns show hits only (no source metadata). */
export async function searchShowsForQuery(q: string, limit = 6): Promise<ShowSearchResult[]> {
  const { results } = await searchShowsByArtist(q, limit);
  return results;
}
