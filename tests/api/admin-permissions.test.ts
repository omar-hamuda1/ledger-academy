import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { PATCH } from "@/app/api/users/[id]/route";
import { PATCH as PATCH_SETTINGS } from "@/app/api/settings/route";
import { createUser, cleanupUser } from "../helpers/fixtures";

// Admin permission scopes (2026-09-09). `setPermissions` is super-admin only and
// is the sole writer of `User.restrictedScopes`; scoped API routes go through
// `requireScope`, which super-admins bypass.
describe("admin permission scopes", () => {
  let superA: Awaited<ReturnType<typeof createUser>>;
  let regularAdmin: Awaited<ReturnType<typeof createUser>>;
  let targetAdmin: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    [superA, regularAdmin, targetAdmin, student] = await Promise.all([
      createUser("ADMIN", { superAdmin: true }),
      createUser("ADMIN"),
      createUser("ADMIN"),
      createUser("STUDENT"),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      cleanupUser(superA.id),
      cleanupUser(regularAdmin.id),
      cleanupUser(targetAdmin.id),
      cleanupUser(student.id),
    ]);
  });

  function actingAs(id: string, role: "ADMIN" | "STUDENT" = "ADMIN") {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id, role } } as never);
  }

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    actingAs(superA.id);
  });

  const setPerms = (id: string, restrictedScopes: string[]) =>
    PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "setPermissions", restrictedScopes }),
      }),
      { params: Promise.resolve({ id }) },
    );

  const patchSettings = () =>
    PATCH_SETTINGS(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

  it("a regular admin cannot set permissions (403)", async () => {
    actingAs(regularAdmin.id);
    const res = await setPerms(targetAdmin.id, ["settings"]);
    expect(res.status).toBe(403);
  });

  it("a super-admin sets and clears an admin's restricted scopes, and it is audited", async () => {
    const res = await setPerms(targetAdmin.id, ["settings", "codes", "settings"]);
    expect(res.status).toBe(200);
    const row = await db.user.findUnique({ where: { id: targetAdmin.id } });
    expect([...row!.restrictedScopes].sort()).toEqual(["codes", "settings"]); // deduped
    const audit = await db.auditLog.findFirst({
      where: { action: "user.permissions_change", targetId: targetAdmin.id },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();

    const cleared = await setPerms(targetAdmin.id, []);
    expect(cleared.status).toBe(200);
    expect(
      (await db.user.findUnique({ where: { id: targetAdmin.id } }))!.restrictedScopes,
    ).toEqual([]);
  });

  it("cannot restrict a super-admin (400) or a student (400)", async () => {
    expect((await setPerms(superA.id, ["settings"])).status).toBe(400);
    expect((await setPerms(student.id, ["settings"])).status).toBe(400);
  });

  it("rejects an unknown scope key (400)", async () => {
    const res = await setPerms(targetAdmin.id, ["not-a-real-scope"]);
    expect(res.status).toBe(400);
  });

  it("requireScope blocks a route the admin is restricted from, allows the rest", async () => {
    await setPerms(regularAdmin.id, ["settings"]);

    actingAs(regularAdmin.id);
    expect((await patchSettings()).status).toBe(403); // settings restricted

    await actingAs(superA.id);
    await setPerms(regularAdmin.id, []); // unrestrict
    actingAs(regularAdmin.id);
    expect((await patchSettings()).status).not.toBe(403); // 400 (empty body) — gate passed
  });

  it("a super-admin bypasses their own restrictedScopes on a scoped route", async () => {
    await db.user.update({
      where: { id: superA.id },
      data: { restrictedScopes: ["settings"] },
    });
    actingAs(superA.id);
    expect((await patchSettings()).status).not.toBe(403);
    await db.user.update({ where: { id: superA.id }, data: { restrictedScopes: [] } });
  });
});
