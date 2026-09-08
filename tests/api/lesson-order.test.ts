import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as createLesson } from "@/app/api/lessons/route";
import { POST as createModule } from "@/app/api/modules/route";
import { createUser, createCourse, cleanupCourse, cleanupUser } from "../helpers/fixtures";

// Regression for the order-collision fix: a new lesson/module `order` must be
// max(existing) + 1, NOT count + 1 — the latter re-mints a value that's still
// in use after a middle item is deleted.
describe("lesson / module order is collision-free after a middle delete", () => {
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

  const jsonReq = (body: unknown) =>
    new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("new lesson gets max+1 even after the middle lesson is deleted", async () => {
    const mod = await db.module.create({ data: { title: "M", courseId: course.id, order: 1 } });
    await db.lesson.create({ data: { title: "L1", moduleId: mod.id, order: 1 } });
    const l2 = await db.lesson.create({ data: { title: "L2", moduleId: mod.id, order: 2 } });
    await db.lesson.create({ data: { title: "L3", moduleId: mod.id, order: 3 } });

    await db.lesson.delete({ where: { id: l2.id } });

    const res = await createLesson(jsonReq({ moduleId: mod.id, title: "L4" }));
    expect(res.status).toBe(201);
    const { lesson } = await res.json();
    expect(lesson.order).toBe(4);

    const orders = (
      await db.lesson.findMany({ where: { moduleId: mod.id }, select: { order: true } })
    ).map((x) => x.order);
    expect(new Set(orders).size).toBe(orders.length); // no duplicates

    await db.lesson.deleteMany({ where: { moduleId: mod.id } });
    await db.module.delete({ where: { id: mod.id } });
  });

  it("new module gets max+1 even after the middle module is deleted", async () => {
    await db.module.create({ data: { title: "A", courseId: course.id, order: 1 } });
    const m2 = await db.module.create({ data: { title: "B", courseId: course.id, order: 2 } });
    await db.module.create({ data: { title: "C", courseId: course.id, order: 3 } });

    await db.module.delete({ where: { id: m2.id } });

    const res = await createModule(jsonReq({ courseId: course.id, title: "D" }));
    expect(res.status).toBe(201);
    const { module: created } = await res.json();
    expect(created.order).toBe(4);

    await db.module.deleteMany({ where: { courseId: course.id } });
  });
});
