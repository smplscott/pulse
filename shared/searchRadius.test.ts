import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_RADIUS_KM,
  MAX_RADIUS_KM,
  clampRadiusKm,
  formatRadius,
  kmToMiles,
  milesToKm,
  nearestPreset,
  RADIUS_KM_PRESETS,
} from "./searchRadius";

test("clampRadiusKm defaults and caps at 250", () => {
  assert.equal(clampRadiusKm(undefined), DEFAULT_RADIUS_KM);
  assert.equal(clampRadiusKm("nope"), DEFAULT_RADIUS_KM);
  assert.equal(clampRadiusKm(0), 1);
  assert.equal(clampRadiusKm(400), MAX_RADIUS_KM);
  assert.equal(clampRadiusKm(75.4), 75);
});

test("mile conversion stays inside the 250km cap", () => {
  assert.equal(kmToMiles(50), 31);
  assert.equal(kmToMiles(250), 155);
  assert.equal(milesToKm(155), 249);
  assert.equal(milesToKm(200), MAX_RADIUS_KM);
});

test("formatRadius and nearest preset keep Signal chips aligned", () => {
  assert.equal(formatRadius(50, "km"), "50 km");
  assert.equal(formatRadius(50, "mi"), "31 mi");
  assert.equal(nearestPreset(40, RADIUS_KM_PRESETS), 50);
  assert.equal(nearestPreset(220, RADIUS_KM_PRESETS), 250);
});
