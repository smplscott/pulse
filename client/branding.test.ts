import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, "index.html"), "utf8");

const requiredFiles = [
  "public/favicon.ico",
  "public/favicon-16x16.png",
  "public/favicon-32x32.png",
  "public/apple-touch-icon.png",
  "public/android-chrome-192x192.png",
  "public/android-chrome-512x512.png",
  "public/og-image.png",
  "public/pulse-icon.png",
  "public/pulse-wordmark.png",
  "public/site.webmanifest",
];

test("brand assets exist for tab, homescreen, and share", () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(join(root, file)), true, `missing ${file}`);
  }
});

test("index.html points browsers and share crawlers at the Pulse mark", () => {
  assert.match(html, /rel="icon" href="\/favicon\.ico"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /href="\/apple-touch-icon\.png"/);
  assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
  assert.match(html, /property="og:image" content="\/og-image\.png"/);
  assert.match(html, /name="twitter:image" content="\/og-image\.png"/);
  assert.match(html, /name="theme-color" content="#000000"/);
});

test("web manifest uses the Pulse mark for add to homescreen", () => {
  const manifest = JSON.parse(readFileSync(join(root, "public/site.webmanifest"), "utf8")) as {
    name: string;
    icons: Array<{ src: string; sizes: string }>;
  };
  assert.equal(manifest.name, "Pulse");
  const srcs = manifest.icons.map(icon => icon.src);
  assert.ok(srcs.includes("/android-chrome-192x192.png"));
  assert.ok(srcs.includes("/android-chrome-512x512.png"));
  assert.ok(srcs.includes("/apple-touch-icon.png"));
});
