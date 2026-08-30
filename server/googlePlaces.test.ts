import assert from "node:assert/strict";
import test from "node:test";
import {
  autocompleteGooglePlaces,
  getGooglePlaceDetails,
  GooglePlacesError,
} from "./googlePlaces";

test("city autocomplete sends the cities collection and session token", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const fetchImpl: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      suggestions: [{
        placePrediction: {
          placeId: "city-1",
          text: { text: "Berlin, Germany" },
          structuredFormat: {
            mainText: { text: "Berlin" },
            secondaryText: { text: "Germany" },
          },
          types: ["locality"],
        },
      }],
    }), { status: 200 });
  };

  const results = await autocompleteGooglePlaces("Ber", "city", "session-123", {
    apiKey: "test-key",
    fetchImpl,
  });

  assert.deepEqual(requestBody?.includedPrimaryTypes, ["(cities)"]);
  assert.equal(requestBody?.sessionToken, "session-123");
  assert.equal(requestBody?.includeQueryPredictions, false);
  assert.deepEqual(results, [{
    placeId: "city-1",
    text: "Berlin, Germany",
    mainText: "Berlin",
    secondaryText: "Germany",
    types: ["locality"],
  }]);
});

test("place autocomplete leaves primary types unrestricted", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const fetchImpl: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  };

  await autocompleteGooglePlaces("Fabric", "place", "session-456", {
    apiKey: "test-key",
    fetchImpl,
  });

  assert.equal("includedPrimaryTypes" in (requestBody ?? {}), false);
  assert.equal(requestBody?.sessionToken, "session-456");
});

test("place details maps canonical location fields and forwards the session token", async () => {
  let requestedUrl = "";
  let requestedMask = "";
  const fetchImpl: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedMask = new Headers(init?.headers).get("X-Goog-FieldMask") ?? "";
    return new Response(JSON.stringify({
      id: "venue-1",
      displayName: { text: "Fabric" },
      formattedAddress: "77A Charterhouse St, London, UK",
      addressComponents: [
        { longText: "London", shortText: "London", types: ["postal_town"] },
        { longText: "United Kingdom", shortText: "GB", types: ["country"] },
      ],
      location: { latitude: 51.52, longitude: -0.1 },
      primaryType: "night_club",
      googleMapsUri: "https://maps.google.com/fabric",
      photos: [{
        name: "places/venue-1/photos/photo-1",
        authorAttributions: [{ displayName: "Example Photographer", uri: "https://example.com" }],
      }],
    }), { status: 200 });
  };

  const result = await getGooglePlaceDetails("venue-1", "place", "session-789", {
    apiKey: "test-key",
    fetchImpl,
  });

  assert.match(requestedUrl, /sessionToken=session-789/);
  assert.match(requestedMask, /googleMapsUri/);
  assert.deepEqual(result, {
    placeId: "venue-1",
    displayName: "Fabric",
    formattedAddress: "77A Charterhouse St, London, UK",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.52,
    longitude: -0.1,
    primaryType: "night_club",
    googleMapsUri: "https://maps.google.com/fabric",
    photoName: "places/venue-1/photos/photo-1",
    photoAttributions: [{
      displayName: "Example Photographer",
      uri: "https://example.com",
      photoUri: undefined,
    }],
  });
});

test("missing API keys and provider rate limits return typed errors", async () => {
  await assert.rejects(
    autocompleteGooglePlaces("Berlin", "city", "session", { apiKey: "" }),
    (error: unknown) => error instanceof GooglePlacesError && error.status === 503,
  );

  const fetchImpl: typeof fetch = async () => new Response("", { status: 429 });
  await assert.rejects(
    autocompleteGooglePlaces("Berlin", "city", "session", { apiKey: "test-key", fetchImpl }),
    (error: unknown) =>
      error instanceof GooglePlacesError &&
      error.status === 429 &&
      error.message === "Google Places rate limit reached",
  );
});
