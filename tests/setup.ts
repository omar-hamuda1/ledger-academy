import { config } from "dotenv";
import path from "node:path";
import { vi } from "vitest";

// Point every test at the dedicated Neon "test" branch (see .env.test),
// never the real dev/production database. Loaded before any test file
// imports src/lib/db, so PrismaClient picks this up at construction time.
config({ path: path.resolve(__dirname, "../.env.test"), override: true, quiet: true });

// Routes are imported and called directly here, so there's no Next request
// scope — `after(cb)` would throw. Run the callback inline instead (tests can
// then await the route to observe the background work).
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (cb: () => unknown) => Promise.resolve(cb()).catch(() => {}) };
});

if (!process.env.DATABASE_URL?.includes("ep-summer-grass")) {
  throw new Error(
    "Tests must run against the Neon 'test' branch (.env.test) — refusing to run against an unexpected DATABASE_URL to avoid touching real data."
  );
}
