import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as createModule } from "@/app/api/modules/route";
import { createUser, createCourse, cleanupCourse, cleanupUser } from "../helpers/fixtures";

// Regression test for the admin audit log (2026-09-06, "known problems" #13:
// no admin audit log existed at all). Every admin mutation route should
// write an AuditLog row recording who did what.
describe("admin audit log", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    course = await createCourse(admin.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(admin.id); // also clears this admin's AuditLog rows
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN", email: admin.email },
    } as never);
  });

  it("writes an AuditLog row when an admin creates a module", async () => {
    const res = await createModule(
      new Request("http://localhost/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, title: "وحدة اختبار السجل" }),
      })
    );
    expect(res.status).toBe(201);
    const { module: created } = await res.json();

    const log = await db.auditLog.findFirst({
      where: { actorId: admin.id, action: "module.create", targetId: created.id },
    });
    expect(log).not.toBeNull();
    expect(log?.actorEmail).toBe(admin.email);
  });
});
