/**
 * Unified show search: Ticketmaster (primary) → Setlist.fm (fallback when empty).
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

function normalizeSetlistDate(eventDate: string): string {
  // Setlist.fm uses dd-MM-yyyy; Pulse stores yyyy-MM-dd
  if (!eventDate) return "";
  const parts = eventDate.split("-");
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return eventDate;
}

async function searchSetlistFm(artist: string, apiKey: string): Promise<ShowSearchResult[]> {
  const url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`;
  const response = await fetch(url, {
    headers: { "x-api-key": apiKey, Accept: "application/json" },
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

/** Search shows for an artist. TM first; Setlist.fm when TM is empty and key is set. */
export async function searchShowsByArtist(artist: string, limit = 20): Promise<{
  results: ShowSearchResult[];
  sources: ("ticketmaster" | "setlistfm")[];
}> {
  const trimmed = artist.trim();
  if (!trimmed) return { results: [], sources: [] };

  const tmResults = await searchEventsByArtist({ keyword: trimmed, size: limit });
  if (tmResults.length > 0) {
    return {
      results: tmResults.slice(0, limit),
      sources: ["ticketmaster"],
    };
  }

  const setlistKey = process.env.SETLISTFM_API_KEY;
  if (!setlistKey) {
    return { results: [], sources: [] };
  }

  try {
    const setlistResults = await searchSetlistFm(trimmed, setlistKey);
    return {
      results: setlistResults.slice(0, limit),
      sources: ["setlistfm"],
    };
  } catch (err) {
    console.warn("[showSearch] Setlist.fm search failed:", err);
    return { results: [], sources: [] };
  }
}

/** Global search helper — returns show hits only (no source metadata). */
export async function searchShowsForQuery(q: string, limit = 6): Promise<ShowSearchResult[]> {
  const { results } = await searchShowsByArtist(q, limit);
  return results;
}
