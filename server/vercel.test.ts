import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { config as vercelFunctionConfig, default as vercelHandler } from "../api/index";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readVercelConfig() {
  return JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
    outputDirectory: string;
    buildCommand: string;
    rewrites?: { source: string; destination: string }[];
  };
}

test("Vercel output directory matches the Vite client build", () => {
  const vercelConfig = readVercelConfig();
  assert.equal(vercelConfig.outputDirectory, "dist/public");
  assert.equal(vercelConfig.buildCommand, "vite build");
  const viteConfigSource = readFileSync(join(root, "vite.config.ts"), "utf8");
  assert.match(viteConfigSource, /outDir:.*dist\/public/);
});

test("Vercel rewrites /api/* to the Express function", () => {
  const vercelConfig = readVercelConfig();
  const apiRewrite = vercelConfig.rewrites?.find((rule) => rule.source.includes("api"));
  assert.ok(apiRewrite, "missing /api rewrite");
  assert.equal(apiRewrite?.destination, "/api");
});

test("Vite production build writes the index file Vercel looks for", async () => {
  const indexPath = join(root, "dist/public/index.html");
  const html = readFileSync(indexPath, "utf8");
  assert.match(html, /<div id="root">/);
  assert.match(html, /\/assets\/index-/);
});

test("Vercel function leaves body parsing to Express", () => {
  assert.equal(vercelFunctionConfig.api.bodyParser, false);
  assert.equal(vercelFunctionConfig.maxDuration, 60);
  assert.equal(typeof vercelHandler, "function");
});

test("Vercel handler serves /api/auth/me without listen()", async () => {
  const server = createServer((req, res) => {
    void vercelHandler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const me = await fetch(`http://127.0.0.1:${address.port}/api/auth/me`);
    assert.equal(me.status, 401);
    assert.equal((await me.json()).message, "Not authenticated");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test("createApp handles auth routes without listen()", async () => {
  const { createApp } = await import("./app");
  const { app } = await createApp();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const me = await fetch(`http://127.0.0.1:${address.port}/api/auth/me`);
    assert.equal(me.status, 401);
    assert.equal((await me.json()).message, "Not authenticated");

    const login = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "dev", password: "dev" }),
    });
    assert.equal(login.status, 200);
    const user = await login.json() as { username: string };
    assert.equal(user.username, "dev");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
