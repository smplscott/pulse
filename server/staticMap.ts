const STATIC_MAP_BASE = "https://maps.googleapis.com/maps/api/staticmap";

export class StaticMapError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "StaticMapError";
  }
}

export function staticMapApiKey(apiKey?: string): string {
  const key = apiKey ?? process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new StaticMapError("Google Maps Static is not configured", 503);
  }
  return key;
}

export function buildStaticMapUrl(
  latitude: number,
  longitude: number,
  apiKey: string,
): string {
  const url = new URL(STATIC_MAP_BASE);
  url.searchParams.set("center", `${latitude},${longitude}`);
  url.searchParams.set("zoom", "15");
  url.searchParams.set("size", "640x280");
  url.searchParams.set("scale", "2");
  url.searchParams.set("maptype", "roadmap");
  url.searchParams.set("markers", `color:0xC2F970|${latitude},${longitude}`);
  url.searchParams.append("style", "feature:all|element:geometry|color:0x212121");
  url.searchParams.append("style", "feature:all|element:labels.text.fill|color:0x9e9e9e");
  url.searchParams.append("style", "feature:all|element:labels.text.stroke|color:0x212121");
  url.searchParams.append("style", "feature:water|element:geometry|color:0x0e1626");
  url.searchParams.append("style", "feature:poi|visibility:off");
  url.searchParams.append("style", "feature:road|element:geometry|color:0x383838");
  url.searchParams.set("key", apiKey);
  return url.toString();
}

export async function fetchPlaceStaticMap(
  latitude: number,
  longitude: number,
  options: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<{ body: Buffer; contentType: string }> {
  const apiKey = staticMapApiKey(options.apiKey);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(buildStaticMapUrl(latitude, longitude, apiKey));
  const contentType = response.headers.get("content-type") ?? "";
  const body = Buffer.from(await response.arrayBuffer());

  if (!response.ok || contentType.includes("json") || contentType.includes("text")) {
    throw new StaticMapError(
      response.status === 403 ? "Google Maps Static request was denied" : "Google Maps Static request failed",
      response.status === 403 ? 403 : 502,
    );
  }

  return {
    body,
    contentType: contentType || "image/png",
  };
}
