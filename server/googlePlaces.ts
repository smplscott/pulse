const GOOGLE_PLACES_BASE = "https://places.googleapis.com/v1";

export type GooglePlacesMode = "city" | "place";

export interface GooglePlaceSuggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface GooglePlaceDetails {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  primaryType: string | null;
  googleMapsUri: string;
  photoName: string | null;
  photoAttributions: Array<{
    displayName: string;
    uri?: string;
    photoUri?: string;
  }>;
}

interface GoogleText {
  text?: string;
}

interface GoogleAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      place?: string;
      placeId?: string;
      text?: GoogleText;
      structuredFormat?: {
        mainText?: GoogleText;
        secondaryText?: GoogleText;
      };
      types?: string[];
    };
  }>;
}

interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface GoogleDetailsResponse {
  id?: string;
  displayName?: GoogleText;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  googleMapsUri?: string;
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
      photoUri?: string;
    }>;
  }>;
}

export class GooglePlacesError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GooglePlacesError";
  }
}

function requireApiKey(apiKey?: string) {
  if (!apiKey) {
    throw new GooglePlacesError("Google Places is not configured", 503);
  }
  return apiKey;
}

function component(
  components: GoogleAddressComponent[] | undefined,
  ...types: string[]
) {
  return components?.find(item => item.types?.some(type => types.includes(type)));
}

export async function autocompleteGooglePlaces(
  input: string,
  mode: GooglePlacesMode,
  sessionToken: string,
  options: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<GooglePlaceSuggestion[]> {
  const apiKey = requireApiKey(options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY);
  const fetchImpl = options.fetchImpl ?? fetch;
  const body: Record<string, unknown> = {
    input,
    sessionToken,
    includeQueryPredictions: false,
    languageCode: "en",
  };
  if (mode === "city") {
    body.includedPrimaryTypes = ["(cities)"];
  }

  const response = await fetchImpl(`${GOOGLE_PLACES_BASE}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new GooglePlacesError(
      response.status === 429 ? "Google Places rate limit reached" : "Google Places search failed",
      response.status,
    );
  }

  const data = await response.json() as GoogleAutocompleteResponse;
  return (data.suggestions ?? []).flatMap(item => {
    const prediction = item.placePrediction;
    const placeId = prediction?.placeId ?? prediction?.place?.replace(/^places\//, "");
    if (!prediction || !placeId) return [];
    return [{
      placeId,
      text: prediction.text?.text ?? "",
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "",
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
      types: prediction.types ?? [],
    }];
  });
}

export async function getGooglePlaceDetails(
  placeId: string,
  mode: GooglePlacesMode,
  sessionToken: string,
  options: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<GooglePlaceDetails> {
  const apiKey = requireApiKey(options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY);
  const fetchImpl = options.fetchImpl ?? fetch;
  const fieldMask = mode === "city"
    ? "id,formattedAddress,addressComponents,location"
    : "id,displayName,formattedAddress,addressComponents,location,primaryType,googleMapsUri,photos";
  const url = new URL(`${GOOGLE_PLACES_BASE}/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("sessionToken", sessionToken);
  url.searchParams.set("languageCode", "en");

  const response = await fetchImpl(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });
  if (!response.ok) {
    throw new GooglePlacesError("Google Place details failed", response.status);
  }

  const data = await response.json() as GoogleDetailsResponse;
  const cityComponent = component(
    data.addressComponents,
    "locality",
    "postal_town",
    "administrative_area_level_2",
    "administrative_area_level_1",
  );
  const countryComponent = component(data.addressComponents, "country");
  const photo = data.photos?.[0];
  return {
    placeId: data.id ?? placeId,
    displayName: data.displayName?.text ?? cityComponent?.longText ?? "",
    formattedAddress: data.formattedAddress ?? "",
    city: cityComponent?.longText ?? "",
    country: countryComponent?.longText ?? "",
    countryCode: countryComponent?.shortText?.toUpperCase() ?? "",
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    primaryType: data.primaryType ?? null,
    googleMapsUri: data.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(data.id ?? placeId)}`,
    photoName: photo?.name ?? null,
    photoAttributions: (photo?.authorAttributions ?? []).flatMap(attribution =>
      attribution.displayName
        ? [{
            displayName: attribution.displayName,
            uri: attribution.uri,
            photoUri: attribution.photoUri,
          }]
        : [],
    ),
  };
}
