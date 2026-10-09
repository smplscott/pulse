import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PLACE_CATEGORY_IDS,
  MORE_PLACE_CATEGORY_IDS,
  googleTypeToPlaceCategory,
  isPlaceCategory,
  isPlaceContentRating,
  placeCategoryLabel,
} from "./placeCategories";
import { insertPlaceSchema } from "./schema";

test("default place types stay in the requested order", () => {
  assert.deepEqual([...DEFAULT_PLACE_CATEGORY_IDS], [
    "bar",
    "coffee_shop",
    "club",
    "restaurant",
    "record_store",
    "event_venue",
  ]);
});

test("more place types include the extra venues", () => {
  assert.deepEqual([...MORE_PLACE_CATEGORY_IDS], [
    "listening_bar",
    "barbershop",
    "skate_shop",
    "boutique_store",
    "streetwear_store",
    "gym",
  ]);
});

test("google types map onto the new catalog", () => {
  assert.equal(googleTypeToPlaceCategory("cafe"), "coffee_shop");
  assert.equal(googleTypeToPlaceCategory("night_club"), "club");
  assert.equal(googleTypeToPlaceCategory("restaurant"), "restaurant");
  assert.equal(googleTypeToPlaceCategory("concert_hall"), "event_venue");
  assert.equal(googleTypeToPlaceCategory("barber_shop"), "barbershop");
  assert.equal(googleTypeToPlaceCategory("unknown_type"), "bar");
});

test("place category labels cover every catalog id", () => {
  assert.equal(placeCategoryLabel("listening_bar"), "Listening Bar");
  assert.equal(placeCategoryLabel("streetwear_store"), "Streetwear Store");
  assert.equal(isPlaceCategory("gym"), true);
  assert.equal(isPlaceCategory("museum"), false);
  assert.equal(isPlaceContentRating("explicit"), true);
  assert.equal(isPlaceContentRating("pg13"), false);
});

const basePlace = {
  userId: 1,
  name: "Fold",
  city: "London",
  country: "United Kingdom",
  category: "club" as const,
  description: "Warehouse nights with a proper system.",
};

test("creating a place requires at least one genre and accepts more", () => {
  assert.equal(insertPlaceSchema.safeParse({ ...basePlace, genres: [] }).success, false);
  assert.equal(insertPlaceSchema.safeParse({ ...basePlace, genres: ["Techno"] }).success, true);
  assert.equal(insertPlaceSchema.safeParse({
    ...basePlace,
    genres: ["Techno", "House", "Disco"],
  }).success, true);
});

test("new place types and optional tags validate", () => {
  const parsed = insertPlaceSchema.safeParse({
    ...basePlace,
    category: "listening_bar",
    genres: ["Jazz"],
    hostsLiveMusic: true,
    brandsTourHere: false,
    contentRating: "explicit",
    playedArtists: [
      { spotifyId: "abc123", name: "Four Tet", imageUrl: "https://i.scdn.co/image/test" },
    ],
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.hostsLiveMusic, true);
    assert.equal(parsed.data.contentRating, "explicit");
    assert.equal(parsed.data.playedArtists?.[0]?.name, "Four Tet");
  }
});

test("clean/explicit and played artists stay optional", () => {
  const parsed = insertPlaceSchema.safeParse({
    ...basePlace,
    category: "skate_shop",
    genres: ["Hip-Hop"],
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.contentRating ?? null, null);
    assert.deepEqual(parsed.data.playedArtists ?? [], []);
    assert.equal(parsed.data.hostsLiveMusic ?? false, false);
    assert.equal(parsed.data.brandsTourHere ?? false, false);
  }
});
