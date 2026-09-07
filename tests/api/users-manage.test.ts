import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { PATCH } from "@/app/api/users/[id]/route";
import { createUser, cleanupUser } from "../helpers/fixtures";

// PATCH /api/users/[id] — admin promote/demote + disable/enable, added
// 2026-09-07. Guards: no self-edit, always keep one active ADMIN.
describe("PATCH /api/users/[id]", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let other: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    other = await createUser("STUDENT");
  });

  afterAll(async () => {
    await cleanupUser(admin.id);
    await cleanupUser(other.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN" },
    } as never);
  });

  const call = (id: string, body: unknown) =>
    PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("promotes a STUDENT to ADMIN and back down (another admin exists)", async () => {
    const up = await call(other.id, { action: "setRole", role: "ADMIN" });
    expect(up.status).toBe(200);
    expect((await db.user.findUnique({ where: { id: other.id } }))!.role).toBe("ADMIN");

    const down = await call(other.id, { action: "setRole", role: "STUDENT" });
    expect(down.status).toBe(200);
    expect((await db.user.findUnique({ where: { id: other.id } }))!.role).toBe("STUDENT");
  });

  it("disables then re-enables a student", async () => {
    const off = await call(other.id, { action: "setDisabled", disabled: true });
    expect(off.status).toBe(200);
    expect((await db.user.findUnique({ where: { id: other.id } }))!.disabledAt).not.toBeNull();

    const on = await call(other.id, { action: "setDisabled", disabled: false });
    expect(on.status).toBe(200);
    expect((await db.user.findUnique({ where: { id: other.id } }))!.disabledAt).toBeNull();
  });

  it("resets a password: generated one is returned and actually works", async () => {
    const res = await call(other.id, { action: "setPassword" });
    expect(res.status).toBe(200);
    const { password } = await res.json();
    expect(typeof password).toBe("string");
    expect(password.length).toBeGreaterThanOrEqual(8);
    const hash = (await db.user.findUnique({ where: { id: other.id } }))!.passwordHash!;
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it("resets a password to an admin-supplied value", async () => {
    const res = await call(other.id, { action: "setPassword", password: "chosen-pass-123" });
    expect(res.status).toBe(200);
    expect((await res.json()).password).toBe("chosen-pass-123");
    const hash = (await db.user.findUnique({ where: { id: other.id } }))!.passwordHash!;
    expect(await bcrypt.compare("chosen-pass-123", hash)).toBe(true);
  });

  it("rejects a too-short supplied password (400)", async () => {
    const res = await call(other.id, { action: "setPassword", password: "short" });
    expect(res.status).toBe(400);
  });

  it("a disabled admin is rejected by the guard (403)", async () => {
    // requireAdmin() re-reads the account, so disabling an admin locks them
    // out of admin actions on the next request — not just at token expiry.
    const rogue = await createUser("ADMIN");
    await db.user.update({ where: { id: rogue.id }, data: { disabledAt: new Date() } });
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: rogue.id, role: "ADMIN" },
    } as never);
    const res = await call(other.id, { action: "setDisabled", disabled: true });
    expect(res.status).toBe(403);
    await cleanupUser(rogue.id);
  });

  it("won't let an admin edit their own row (400)", async () => {
    const res = await call(admin.id, { action: "setRole", role: "STUDENT" });
    expect(res.status).toBe(400);
    expect((await db.user.findUnique({ where: { id: admin.id } }))!.role).toBe("ADMIN");
  });

  it("rejects a non-admin (403)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: other.id, role: "STUDENT" },
    } as never);
    const res = await call(admin.id, { action: "setDisabled", disabled: true });
    expect(res.status).toBe(403);
  });
});
