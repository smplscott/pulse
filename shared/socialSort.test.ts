import assert from "node:assert/strict";
import test from "node:test";
import { insertPlaceSchema } from "./schema";
import {
  filterAttending,
  matchesFollowedArtist,
  sortByRepeatsThenRecency,
  sortBySocialScoreThenRecency,
} from "./socialSort";

test("Home following filter matches artist names case-insensitively", () => {
  const followed = new Set(["four tet", "floating points"]);
  assert.equal(matchesFollowedArtist("Four Tet", followed), true);
  assert.equal(matchesFollowedArtist("  floating points ", followed), true);
  assert.equal(matchesFollowedArtist("Aphex Twin", followed), false);
  assert.equal(matchesFollowedArtist(null, followed), false);
});

test("attending filter keeps only matches with attendingAt", () => {
  const matches = [
    { id: 1, attendingAt: "2026-09-01T00:00:00.000Z" },
    { id: 2, attendingAt: null },
  ];
  assert.deepEqual(filterAttending(matches, true).map(item => item.id), [1]);
  assert.deepEqual(filterAttending(matches, false).map(item => item.id), [1, 2]);
});

test("entity reviews sort by repeats then recency", () => {
  const items = [
    { id: 1, createdAt: "2026-09-01T00:00:00.000Z" },
    { id: 2, createdAt: "2026-09-03T00:00:00.000Z" },
    { id: 3, createdAt: "2026-09-02T00:00:00.000Z" },
  ];
  const sorted = sortByRepeatsThenRecency(items, new Map([[1, 1], [2, 4], [3, 4]]));
  assert.deepEqual(sorted.map(item => item.id), [2, 3, 1]);
});

test("Home featured sort uses likes + replies then recency", () => {
  const items = [
    { id: 1, createdAt: "2026-09-04T00:00:00.000Z" },
    { id: 2, createdAt: "2026-09-01T00:00:00.000Z" },
    { id: 3, createdAt: "2026-09-03T00:00:00.000Z" },
  ];
  const sorted = sortBySocialScoreThenRecency(items, new Map([[1, 2], [2, 5], [3, 5]]));
  assert.deepEqual(sorted.map(item => item.id), [3, 2, 1]);
});

test("creating a place requires at least one genre", () => {
  const base = {
    userId: 1,
    name: "Fold",
    city: "London",
    country: "United Kingdom",
    category: "club" as const,
    description: "Room",
  };
  assert.equal(insertPlaceSchema.safeParse({ ...base, genres: [] }).success, false);
  assert.equal(insertPlaceSchema.safeParse({ ...base, genres: ["Techno"] }).success, true);
});
