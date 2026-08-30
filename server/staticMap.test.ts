import assert from "node:assert/strict";
import test from "node:test";
import { buildStaticMapUrl, fetchPlaceStaticMap, StaticMapError, staticMapApiKey } from "./staticMap";

test("staticMapApiKey prefers Maps then Places and 503s when missing", () => {
  assert.equal(staticMapApiKey("explicit"), "explicit");
  assert.throws(() => staticMapApiKey(""), (error: unknown) => (
    error instanceof StaticMapError && error.status === 503
  ));
});

test("buildStaticMapUrl pins the venue without exposing a client URL helper", () => {
  const url = new URL(buildStaticMapUrl(51.52, -0.1, "test-key"));
  assert.equal(url.searchParams.get("center"), "51.52,-0.1");
  assert.equal(url.searchParams.get("markers"), "color:0xC2F970|51.52,-0.1");
  assert.equal(url.searchParams.get("size"), "640x280");
  assert.equal(url.searchParams.get("key"), "test-key");
});

test("fetchPlaceStaticMap returns image bytes and rejects JSON error bodies", async () => {
  const ok = await fetchPlaceStaticMap(51.52, -0.1, {
    apiKey: "test-key",
    fetchImpl: async () => new Response(Buffer.from([137, 80, 78, 71]), {
      status: 200,
      headers: { "content-type": "image/png" },
    }),
  });
  assert.equal(ok.contentType, "image/png");
  assert.equal(ok.body[0], 137);

  await assert.rejects(
    fetchPlaceStaticMap(51.52, -0.1, {
      apiKey: "test-key",
      fetchImpl: async () => new Response(JSON.stringify({ error: "denied" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    }),
    (error: unknown) => error instanceof StaticMapError && error.status === 403,
  );
});
