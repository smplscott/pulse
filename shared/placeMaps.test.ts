import assert from "node:assert/strict";
import test from "node:test";
import {
  hasStoredCoordinates,
  isMapPinPlace,
  placeDirectionsUrl,
  recommendedGenre,
} from "./placeMaps";

test("placeDirectionsUrl prefers mapsLink, then place id, then coordinates", () => {
  assert.equal(
    placeDirectionsUrl({ mapsLink: "https://maps.google.com/?cid=1", googlePlaceId: "abc", latitude: 1, longitude: 2 }),
    "https://maps.google.com/?cid=1",
  );
  assert.equal(
    placeDirectionsUrl({ googlePlaceId: "ChIJ123", latitude: 51.5, longitude: -0.1 }),
    "https://www.google.com/maps/dir/?api=1&destination_place_id=ChIJ123",
  );
  assert.equal(
    placeDirectionsUrl({ latitude: 52.52, longitude: 13.4 }),
    "https://www.google.com/maps/dir/?api=1&destination=52.52,13.4",
  );
  assert.equal(placeDirectionsUrl({}), null);
});

test("isMapPinPlace requires a review and finite coordinates", () => {
  assert.equal(isMapPinPlace({ reviewCount: 1, latitude: 51.5, longitude: -0.1 }), true);
  assert.equal(isMapPinPlace({ reviewsCount: 2, latitude: 51.5, longitude: -0.1 }), true);
  assert.equal(isMapPinPlace({ reviewCount: 0, latitude: 51.5, longitude: -0.1 }), false);
  assert.equal(isMapPinPlace({ reviewCount: 1, latitude: null, longitude: -0.1 }), false);
  assert.equal(hasStoredCoordinates({ latitude: Number.NaN, longitude: 0 }), false);
});

test("recommendedGenre uses the first non-empty genre", () => {
  assert.equal(recommendedGenre({ genres: ["Techno", "House"] }), "Techno");
  assert.equal(recommendedGenre({ genres: ["", "House"] }), "House");
  assert.equal(recommendedGenre({ genres: [] }), null);
});
