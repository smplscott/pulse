/** Ticketmaster Discovery API client (events search for wishlist × trip matching). */

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

/** Small country-name → ISO 3166-1 alpha-2 map for common trip destinations. */
const COUNTRY_CODES: Record<string, string> = {
  "united states": "US",
  usa: "US",
  us: "US",
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  canada: "CA",
  australia: "AU",
  germany: "DE",
  france: "FR",
  netherlands: "NL",
  holland: "NL",
  spain: "ES",
  italy: "IT",
  ireland: "IE",
  mexico: "MX",
  brazil: "BR",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  belgium: "BE",
  portugal: "PT",
  switzerland: "CH",
  austria: "AT",
  poland: "PL",
  "new zealand": "NZ",
};

export function countryToCode(country: string): string | undefined {
  const key = country.trim().toLowerCase();
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key];
  if (/^[a-z]{2}$/i.test(country.trim())) return country.trim().toUpperCase();
  return undefined;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  imageUrl?: string;
  venueName?: string;
  city?: string;
  country?: string;
  startDateTime?: Date;
  attractionNames: string[];
  isMusic: boolean;
}

interface TmImage { url: string; width?: number; ratio?: string }
interface TmAttraction { name: string }
interface TmVenue {
  name?: string;
  city?: { name?: string };
  country?: { name?: string; countryCode?: string };
}
interface TmClassification {
  segment?: { name?: string };
  genre?: { name?: string };
}
interface TmEventRaw {
  id: string;
  name: string;
  url?: string;
  images?: TmImage[];
  dates?: { start?: { dateTime?: string; localDate?: string; localTime?: string } };
  classifications?: TmClassification[];
  _embedded?: { attractions?: TmAttraction[]; venues?: TmVenue[] };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickImage(images?: TmImage[]): string | undefined {
  if (!images?.length) return undefined;
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted.find((i) => i.ratio === "16_9")?.url ?? sorted[0]?.url;
}

function normalizeEvent(raw: TmEventRaw): TicketmasterEvent {
  const attractions = raw._embedded?.attractions ?? [];
  const venue = raw._embedded?.venues?.[0];
  const start = raw.dates?.start;
  let startDateTime: Date | undefined;
  if (start?.dateTime) {
    startDateTime = new Date(start.dateTime);
  } else if (start?.localDate) {
    startDateTime = new Date(`${start.localDate}T${start.localTime ?? "20:00:00"}`);
  }
  const segment = raw.classifications?.[0]?.segment?.name?.toLowerCase() ?? "";
  const isMusic = !segment || segment === "music";

  return {
    id: raw.id,
    name: raw.name,
    url: raw.url,
    imageUrl: pickImage(raw.images),
    venueName: venue?.name,
    city: venue?.city?.name,
    country: venue?.country?.name ?? venue?.country?.countryCode,
    startDateTime,
    attractionNames: attractions.map((a) => a.name).filter(Boolean),
    isMusic,
  };
}

/** Soft match: artist name appears in event name or attraction names. */
export function eventMatchesArtist(event: TicketmasterEvent, artistName: string): boolean {
  const needle = artistName.trim().toLowerCase();
  if (needle.length < 2) return false;
  if (event.name.toLowerCase().includes(needle)) return true;
  return event.attractionNames.some((n) => n.toLowerCase().includes(needle));
}

export interface SearchEventsParams {
  keyword: string;
  city: string;
  country?: string;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
}

/**
 * Search Ticketmaster events. Throttles ~5 req/s via optional pre-call delay
 * when `throttleMs` is set by the caller between requests.
 */
export async function searchEvents(
  params: SearchEventsParams,
  apiKey = process.env.TICKETMASTER_API_KEY,
): Promise<TicketmasterEvent[]> {
  if (!apiKey) {
    throw new Error("TICKETMASTER_API_KEY is not configured");
  }

  const url = new URL(`${TM_BASE}/events.json`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("keyword", params.keyword);
  url.searchParams.set("city", params.city);
  url.searchParams.set("startDateTime", `${params.startDate}T00:00:00Z`);
  url.searchParams.set("endDateTime", `${params.endDate}T23:59:59Z`);
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("classificationSegment", "Music");

  const countryCode = params.country ? countryToCode(params.country) : undefined;
  if (countryCode) url.searchParams.set("countryCode", countryCode);

  const res = await fetch(url.toString());
  if (res.status === 429) {
    await sleep(1000);
    const retry = await fetch(url.toString());
    if (!retry.ok) {
      console.warn("[ticketmaster] rate limited / failed", retry.status);
      return [];
    }
    const data = await retry.json() as { _embedded?: { events?: TmEventRaw[] } };
    return (data._embedded?.events ?? []).map(normalizeEvent);
  }
  if (!res.ok) {
    console.warn("[ticketmaster] search failed", res.status, await res.text().catch(() => ""));
    return [];
  }

  const data = await res.json() as { _embedded?: { events?: TmEventRaw[] } };
  return (data._embedded?.events ?? []).map(normalizeEvent);
}

export { sleep as tmSleep };
