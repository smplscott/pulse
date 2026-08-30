import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../db";
import { normalizePlaceDedupeKey } from "../placeDedupe";
import { places } from "@shared/schema";

async function run() {
  const apply = process.argv.includes("--apply");
  const rows = await db.select().from(places);
  const groups = new Map<string, typeof rows>();

  for (const place of rows) {
    const key = normalizePlaceDedupeKey(place.name, place.city, place.country);
    const group = groups.get(key) ?? [];
    group.push(place);
    groups.set(key, group);
  }

  const collisions = [...groups.entries()].filter(([, group]) => group.length > 1);
  if (collisions.length > 0) {
    console.log("Duplicate candidates require manual review:");
    for (const [key, group] of collisions) {
      console.log(`- ${key}: ${group.map(place => `#${place.id} ${place.name}`).join(", ")}`);
    }
  } else {
    console.log("No canonical place collisions found.");
  }

  if (apply) {
    const collisionKeys = new Set(collisions.map(([key]) => key));
    let updated = 0;
    for (const [key, group] of groups) {
      const place = group[0];
      if (collisionKeys.has(key) || place.dedupeKey === key) continue;
      await db.update(places).set({ dedupeKey: key }).where(eq(places.id, place.id));
      updated += 1;
    }
    console.log(`Applied dedupe keys to ${updated} place(s); collisions were left unchanged.`);
  } else {
    console.log("Audit only. Re-run with --apply after reviewing collisions.");
  }
}

run()
  .catch(error => {
    console.error("Place dedupe audit failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
