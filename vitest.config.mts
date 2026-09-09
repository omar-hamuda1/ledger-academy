import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    // Tests hit the remote Neon "test" branch. Locally each test is sub-second,
    // but from a CI runner every query is a network round-trip and Neon adds a
    // cold-start when its compute resumes from idle. `hookTimeout` is the larger
    // ceiling because a beforeAll/afterAll that creates + cleans several fixtures
    // is dozens of sequential round-trips (`cleanupUser` alone is ~10 deleteMany).
    // High ceilings; a genuinely hung test still fails.
    testTimeout: 45_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
