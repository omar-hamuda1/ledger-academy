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
    // cold-start when its compute resumes from idle — the multi-step order/enroll
    // tests need well over the 5s default. High ceiling; a hung test still fails.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
