import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DELETE } from "@/app/api/prepaid-codes/[id]/route";
import {
  createUser,
  createCourse,
  createPrepaidCode,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// DELETE /api/prepaid-codes/[id] — added 2026-09-07. Unused codes only; a used
// code is tied to an enrollment and must not be removable.
describe("DELETE /api/prepaid-codes/[id]", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    instructor = await createUser("ADMIN");
    student = await createUser("STUDENT");
    course = await createCourse(instructor.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(admin.id);
    await cleanupUser(instructor.id);
    await cleanupUser(student.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN" },
    } as never);
  });

  const call = (id: string) =>
    DELETE(new Request("http://localhost"), { params: Promise.resolve({ id }) });

  it("deletes an unused code", async () => {
    const code = await createPrepaidCode(course.id);
    const res = await call(code.id);
    expect(res.status).toBe(200);
    expect(await db.prepaidCode.findUnique({ where: { id: code.id } })).toBeNull();
  });

  it("refuses to delete a used code (409) and leaves it intact", async () => {
    const code = await createPrepaidCode(course.id);
    await db.prepaidCode.update({
      where: { id: code.id },
      data: { isUsed: true, usedById: student.id, usedAt: new Date() },
    });

    const res = await call(code.id);
    expect(res.status).toBe(409);
    expect(await db.prepaidCode.findUnique({ where: { id: code.id } })).not.toBeNull();

    await db.prepaidCode.update({
      where: { id: code.id },
      data: { isUsed: false, usedById: null, usedAt: null },
    });
    await db.prepaidCode.delete({ where: { id: code.id } });
  });

  it("returns 404 for a missing code", async () => {
    const res = await call("does-not-exist");
    expect(res.status).toBe(404);
  });

  it("rejects a non-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: student.id, role: "STUDENT" },
    } as never);
    const code = await createPrepaidCode(course.id);
    const res = await call(code.id);
    expect(res.status).toBe(403);
    expect(await db.prepaidCode.findUnique({ where: { id: code.id } })).not.toBeNull();
    await db.prepaidCode.delete({ where: { id: code.id } });
  });
});
