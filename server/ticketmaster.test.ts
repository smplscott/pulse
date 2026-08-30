import assert from "node:assert/strict";
import test from "node:test";
import { countryToCode, resolveTicketmasterCountryCode } from "./ticketmaster";

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
