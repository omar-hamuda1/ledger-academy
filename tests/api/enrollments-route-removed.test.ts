import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

// Regression guard for the payment-bypass fix (2026-09-06 security audit):
// POST /api/enrollments let any authenticated user enroll in any paid
// course with zero price check, completely bypassing Stripe. It had no UI
// caller and was deleted outright. This test fails loudly if the route
// file is ever recreated without deliberately re-adding a real price
// check, since that's exactly how the original bug got introduced.
describe("api/enrollments route", () => {
  it("does not exist as a route file", () => {
    const routePath = path.resolve(__dirname, "../../src/app/api/enrollments/route.ts");
    expect(existsSync(routePath)).toBe(false);
  });
});
