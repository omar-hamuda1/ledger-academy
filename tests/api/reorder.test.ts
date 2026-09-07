import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { PATCH as modulePATCH } from "@/app/api/modules/[id]/route";
import { PATCH as lessonPATCH } from "@/app/api/lessons/[id]/route";
import { createUser, createCourse, cleanupCourse, cleanupUser } from "../helpers/fixtures";

// Covers the move-up/move-down reorder added 2026-09-07: a PATCH with
// { action: "move", direction } swaps `order` with the adjacent sibling
// inside a transaction, and is a no-op at the edges.
describe("PATCH reorder — modules & lessons", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    instructor = await createUser("ADMIN");
    course = await createCourse(instructor.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(admin.id);
    await cleanupUser(instructor.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN" },
    } as never);
  });

  function move(id: string, direction: "up" | "down") {
    return new Request("http://localhost", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "move", direction }),
    });
  }

  async function threeModules() {
    const mods = [];
    for (let i = 1; i <= 3; i++) {
      mods.push(await db.module.create({ data: { title: `M${i}`, courseId: course.id, order: i } }));
    }
    return mods;
  }

  it("moves a middle module up, swapping order with the one above", async () => {
    const [m1, m2] = await threeModules();

    const res = await modulePATCH(move(m2.id, "up"), { params: Promise.resolve({ id: m2.id }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, moved: true });

    expect((await db.module.findUnique({ where: { id: m2.id } }))!.order).toBe(1);
    expect((await db.module.findUnique({ where: { id: m1.id } }))!.order).toBe(2);

    await db.module.deleteMany({ where: { courseId: course.id } });
  });

  it("is a no-op when the top module is moved up", async () => {
    const [m1] = await threeModules();

    const res = await modulePATCH(move(m1.id, "up"), { params: Promise.resolve({ id: m1.id }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, moved: false });
    expect((await db.module.findUnique({ where: { id: m1.id } }))!.order).toBe(1);

    await db.module.deleteMany({ where: { courseId: course.id } });
  });

  it("moves a lesson down, swapping order with the next lesson", async () => {
    const mod = await db.module.create({ data: { title: "M", courseId: course.id, order: 1 } });
    const l1 = await db.lesson.create({ data: { title: "L1", moduleId: mod.id, order: 1 } });
    const l2 = await db.lesson.create({ data: { title: "L2", moduleId: mod.id, order: 2 } });

    const res = await lessonPATCH(move(l1.id, "down"), { params: Promise.resolve({ id: l1.id }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, moved: true });

    expect((await db.lesson.findUnique({ where: { id: l1.id } }))!.order).toBe(2);
    expect((await db.lesson.findUnique({ where: { id: l2.id } }))!.order).toBe(1);

    await db.lesson.deleteMany({ where: { moduleId: mod.id } });
    await db.module.delete({ where: { id: mod.id } });
  });

  it("rejects a non-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "someone", role: "STUDENT" },
    } as never);
    const [m1] = await threeModules();

    const res = await modulePATCH(move(m1.id, "down"), { params: Promise.resolve({ id: m1.id }) });
    expect(res.status).toBe(403);

    await db.module.deleteMany({ where: { courseId: course.id } });
  });
});
