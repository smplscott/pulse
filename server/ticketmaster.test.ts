import assert from "node:assert/strict";
import test from "node:test";
import { buildEventsSearchUrl, countryToCode, resolveTicketmasterCountryCode } from "./ticketmaster";

test("countryToCode maps common names and already-normalized codes", () => {
  assert.equal(countryToCode("United Kingdom"), "GB");
  assert.equal(countryToCode("uk"), "GB");
  assert.equal(countryToCode("DE"), "DE");
  assert.equal(countryToCode("Atlantis"), undefined);
});

test("resolveTicketmasterCountryCode prefers a stored ISO code", () => {
  assert.equal(
    resolveTicketmasterCountryCode({ countryCode: "gb", country: "United States" }),
    "GB",
  );
  assert.equal(
    resolveTicketmasterCountryCode({ countryCode: "  nl ", country: "Germany" }),
    "NL",
  );
});

test("resolveTicketmasterCountryCode falls back to the country name", () => {
  assert.equal(
    resolveTicketmasterCountryCode({ country: "Netherlands" }),
    "NL",
  );
  assert.equal(
    resolveTicketmasterCountryCode({ countryCode: "not-a-code", country: "Japan" }),
    "JP",
  );
  assert.equal(resolveTicketmasterCountryCode({}), undefined);
});

test("Ticketmaster city search keeps country when no coordinates exist", () => {
  const url = buildEventsSearchUrl({
    keyword: "Bicep",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
  }, "test-key");
  assert.equal(url.searchParams.get("city"), "Berlin");
  assert.equal(url.searchParams.get("countryCode"), "DE");
  assert.equal(url.searchParams.get("latlong"), null);
});

test("Ticketmaster geo search uses latlong and a clamped km radius", () => {
  const url = buildEventsSearchUrl({
    keyword: "Bicep",
    city: "Berlin",
    countryCode: "DE",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    latitude: 52.52,
    longitude: 13.405,
    radiusKm: 400,
  }, "test-key");
  assert.equal(url.searchParams.get("latlong"), "52.52,13.405");
  assert.equal(url.searchParams.get("radius"), "250");
  assert.equal(url.searchParams.get("unit"), "km");
  assert.equal(url.searchParams.get("city"), null);
});
