import { config } from "dotenv";
import path from "node:path";

// Point every test at the dedicated Neon "test" branch (see .env.test),
// never the real dev/production database. Loaded before any test file
// imports src/lib/db, so PrismaClient picks this up at construction time.
config({ path: path.resolve(__dirname, "../.env.test"), override: true, quiet: true });

if (!process.env.DATABASE_URL?.includes("ep-summer-grass")) {
  throw new Error(
    "Tests must run against the Neon 'test' branch (.env.test) — refusing to run against an unexpected DATABASE_URL to avoid touching real data."
  );
}
