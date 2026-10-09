import { pool } from "./db";
import { log } from "./log";

const STATEMENTS = [
  `ALTER TABLE places ADD COLUMN IF NOT EXISTS played_artists jsonb DEFAULT '[]'::jsonb`,
  `ALTER TABLE places ADD COLUMN IF NOT EXISTS hosts_live_music boolean DEFAULT false`,
  `ALTER TABLE places ADD COLUMN IF NOT EXISTS brands_tour_here boolean DEFAULT false`,
  `ALTER TABLE places ADD COLUMN IF NOT EXISTS content_rating text`,
];

export async function ensurePlaceTagColumns(): Promise<void> {
  for (const statement of STATEMENTS) {
    await pool.query(statement);
  }
  log("ensured place tag columns");
}
