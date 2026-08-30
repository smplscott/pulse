import assert from "node:assert/strict";
import test from "node:test";
import { normalizePlaceDedupeKey } from "./placeDedupe";

test("normalizePlaceDedupeKey is case, accent, and punctuation insensitive", () => {
  assert.equal(
    normalizePlaceDedupeKey("Café Fabric", "London", "United Kingdom"),
    normalizePlaceDedupeKey("cafe fabric", "london", "united-kingdom"),
  );
  assert.equal(
    normalizePlaceDedupeKey("Fabric!!!", "London", "UK"),
    "fabric|london|uk",
  );
});

test("normalizePlaceDedupeKey treats distinct venues as distinct keys", () => {
  assert.notEqual(
    normalizePlaceDedupeKey("Fabric", "London", "United Kingdom"),
    normalizePlaceDedupeKey("Ministry of Sound", "London", "United Kingdom"),
  );
});
