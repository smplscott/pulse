import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const connectionString = process.env.DATABASE_URL;
const isLocal =
  /localhost|127\.0\.0\.1/i.test(connectionString) ||
  connectionString.includes("@local-pg");

export const pool = new Pool({
  connectionString,
  // Neon and other hosted Postgres require TLS; local embedded/dev DBs do not.
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});
export const db = drizzle(pool, { schema });
