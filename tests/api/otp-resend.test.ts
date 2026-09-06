import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { POST } from "@/app/api/auth/otp/send/route";
import { createUser, cleanupUser } from "../helpers/fixtures";

// Regression test for the OTP resend-confusion fix (2026-09-06 security
// audit): requesting a second OTP code and then verifying against the
// *first* email's code used to fail, because verify only ever checked the
// newest row. /api/auth/otp/send must delete prior unverified codes for
// that email+purpose before issuing a new one, so exactly one live
// candidate exists at a time.
describe("POST /api/auth/otp/send — resend invalidates prior codes", () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    user = await createUser("STUDENT");
  });

  afterAll(async () => {
    await db.otpCode.deleteMany({ where: { email: user.email } });
    await cleanupUser(user.id);
  });

  function request() {
    return new Request("http://localhost/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, purpose: "RESET" }),
    });
  }

  it("leaves exactly one live (unverified) OTP row after two sends", async () => {
    const first = await POST(request());
    expect(first.status).toBe(200);

    const afterFirst = await db.otpCode.findMany({
      where: { email: user.email, purpose: "RESET", verifiedAt: null },
    });
    expect(afterFirst).toHaveLength(1);
    const firstHash = afterFirst[0].codeHash;

    const second = await POST(request());
    expect(second.status).toBe(200);

    const afterSecond = await db.otpCode.findMany({
      where: { email: user.email, purpose: "RESET", verifiedAt: null },
    });
    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].codeHash).not.toBe(firstHash);
  });
});
