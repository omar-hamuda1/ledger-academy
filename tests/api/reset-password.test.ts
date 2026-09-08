import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { POST } from "@/app/api/auth/reset-password/route";
import { createUser, cleanupUser } from "../helpers/fixtures";

// POST /api/auth/reset-password — a verified RESET OTP must already exist
// (that flow is covered elsewhere). Guard added 2026-09-08: the new password
// can't equal the current one.
describe("POST /api/auth/reset-password", () => {
  let user: Awaited<ReturnType<typeof createUser>>;
  const CURRENT = "current-pass-123";

  beforeAll(async () => {
    user = await createUser("STUDENT");
  });

  afterAll(async () => {
    await db.otpCode.deleteMany({ where: { email: user.email } });
    await cleanupUser(user.id);
  });

  beforeEach(async () => {
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(CURRENT, 12) },
    });
    await db.otpCode.deleteMany({ where: { email: user.email } });
    await db.otpCode.create({
      data: {
        email: user.email,
        purpose: "RESET",
        codeHash: "x",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  });

  const call = (password: string) =>
    POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password }),
      }),
    );

  it("rejects resetting to the current password (400) without consuming the OTP", async () => {
    const res = await call(CURRENT);
    expect(res.status).toBe(400);

    const row = await db.user.findUnique({ where: { id: user.id } });
    expect(await bcrypt.compare(CURRENT, row!.passwordHash!)).toBe(true);
    // OTP not burned — user can retry with a different password
    expect(await db.otpCode.count({ where: { email: user.email } })).toBe(1);
  });

  it("accepts a different password (200), updates the hash, consumes the OTP", async () => {
    const res = await call("brand-new-pass-456");
    expect(res.status).toBe(200);

    const row = await db.user.findUnique({ where: { id: user.id } });
    expect(await bcrypt.compare("brand-new-pass-456", row!.passwordHash!)).toBe(true);
    expect(await db.otpCode.count({ where: { email: user.email } })).toBe(0);
  });
});
