import { describe, it, expect, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { POST } from "@/app/api/register/route";

// POST /api/register — creates the account after a verified SIGNUP OTP. Since
// 2026-09-09 a guardian-consent checkbox is required (students are minors).
describe("POST /api/register", () => {
  const emails: string[] = [];

  afterEach(async () => {
    for (const email of emails.splice(0)) {
      await db.user.deleteMany({ where: { email } });
      await db.otpCode.deleteMany({ where: { email } });
    }
  });

  async function seedVerifiedOtp() {
    const email = `reg-${randomUUID()}@example.com`;
    emails.push(email);
    await db.otpCode.create({
      data: {
        email,
        purpose: "SIGNUP",
        codeHash: "x",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return email;
  }

  // A fresh IP per call — POST /api/register is rate-limited 5/10min per IP,
  // and this file makes more than 5 calls.
  const call = (body: unknown) =>
    POST(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        },
        body: JSON.stringify(body),
      }),
    );

  const base = (email: string) => ({ name: "طالب", email, password: "password123" });

  it("rejects a signup with no guardian consent (400)", async () => {
    const email = await seedVerifiedOtp();
    const res = await call(base(email));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("ولي الأمر");
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });

  it("rejects guardianConsent: false (400)", async () => {
    const email = await seedVerifiedOtp();
    const res = await call({ ...base(email), guardianConsent: false });
    expect(res.status).toBe(400);
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });

  it("creates the account with consent and stamps guardianConsentAt", async () => {
    const email = await seedVerifiedOtp();
    const res = await call({ ...base(email), guardianConsent: true });
    expect(res.status).toBe(201);
    const user = await db.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user!.guardianConsentAt).toBeInstanceOf(Date);
    expect(user!.guardianName).toBeNull();
    expect(user!.guardianContact).toBeNull();
  });

  it("stores the optional guardian name and contact", async () => {
    const email = await seedVerifiedOtp();
    const res = await call({
      ...base(email),
      guardianConsent: true,
      guardianName: "أحمد",
      guardianContact: "01000000000",
    });
    expect(res.status).toBe(201);
    const user = await db.user.findUnique({ where: { email } });
    expect(user!.guardianName).toBe("أحمد");
    expect(user!.guardianContact).toBe("01000000000");
  });

  it("rejects a junk name (digits / link / too short) but keeps the guardian check separate", async () => {
    for (const name of ["Ahmed123", "visit www.spam.com", "x"]) {
      const email = await seedVerifiedOtp();
      const res = await call({ name, email, password: "password123", guardianConsent: true });
      expect(res.status).toBe(400);
      expect(await db.user.findUnique({ where: { email } })).toBeNull();
    }
  });

  it("normalizes a valid name (trim + collapse spaces)", async () => {
    const email = await seedVerifiedOtp();
    const res = await call({
      name: "  محمد   حسين  ",
      email,
      password: "password123",
      guardianConsent: true,
    });
    expect(res.status).toBe(201);
    expect((await db.user.findUnique({ where: { email } }))!.name).toBe("محمد حسين");
  });

  it("still requires a verified OTP even with consent (400)", async () => {
    const email = `reg-${randomUUID()}@example.com`;
    emails.push(email);
    const res = await call({ ...base(email), guardianConsent: true });
    expect(res.status).toBe(400);
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });
});
