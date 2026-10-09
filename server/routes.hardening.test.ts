import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createApp } from "./app";

async function listen() {
  const { app } = await createApp();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    }),
  };
}

async function login(base: string) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "dev", password: "dev" }),
  });
  assert.equal(res.status, 200);
  const user = await res.json() as { id: number; username: string; email?: string };
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "expected session cookie");
  return { user, cookie };
}

test("GET /api/users/:id omits email and password", async () => {
  const { base, close } = await listen();
  try {
    const { user } = await login(base);
    const res = await fetch(`${base}/api/users/${user.id}`);
    assert.equal(res.status, 200);
    const body = await res.json() as Record<string, unknown>;
    assert.equal(body.username, "dev");
    assert.equal("email" in body, false);
    assert.equal("password" in body, false);
  } finally {
    await close();
  }
});

test("Signal private GETs require the signed-in owner", async () => {
  const { base, close } = await listen();
  try {
    const { user, cookie } = await login(base);
    for (const path of [
      `/api/users/${user.id}/travel-plans`,
      `/api/users/${user.id}/show-wishlist`,
      `/api/users/${user.id}/wishlist-matches`,
    ]) {
      const anon = await fetch(`${base}${path}`);
      assert.equal(anon.status, 401, `${path} should reject anonymous`);
    }

    const otherPlans = await fetch(`${base}/api/users/${user.id + 999}/travel-plans`, {
      headers: { cookie },
    });
    assert.equal(otherPlans.status, 403);

    const ownPlans = await fetch(`${base}/api/users/${user.id}/travel-plans`, {
      headers: { cookie },
    });
    assert.equal(ownPlans.status, 200);
    assert.ok(Array.isArray(await ownPlans.json()));
  } finally {
    await close();
  }
});

test("mutating public write endpoints require auth", async () => {
  const { base, close } = await listen();
  try {
    const show = await fetch(`${base}/api/shows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artistName: "Test",
        venueName: "Venue",
        city: "Austin",
        country: "United States",
        eventDate: "2026-01-01",
      }),
    });
    assert.equal(show.status, 401);

    const upvote = await fetch(`${base}/api/comments/1/upvote`, { method: "POST" });
    assert.equal(upvote.status, 401);
  } finally {
    await close();
  }
});

test("invalid featured limit and review type do not 500", async () => {
  const { base, close } = await listen();
  try {
    const featured = await fetch(`${base}/api/threads/featured?limit=abc`);
    assert.equal(featured.status, 200);
    assert.ok(Array.isArray(await featured.json()));

    const review = await fetch(`${base}/api/reviews/not-a-type/1`);
    assert.equal(review.status, 400);
  } finally {
    await close();
  }
});
