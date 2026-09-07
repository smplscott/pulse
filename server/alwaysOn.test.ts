import assert from "node:assert/strict";
import test from "node:test";
import { addMonthsIso, alwaysOnScanWindow } from "./jobs/scanWishlistMatches";

test("always-on scan window is today through 18 months", () => {
  const window = alwaysOnScanWindow("2026-09-07");
  assert.equal(window.startDate, "2026-09-07");
  assert.equal(window.endDate, addMonthsIso("2026-09-07", 18));
  assert.equal(window.endDate, "2028-03-07");
});
