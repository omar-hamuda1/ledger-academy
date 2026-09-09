import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DELETE } from "@/app/api/users/[id]/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  createCodeOrder,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// DELETE /api/users/[id] — hard delete (src/lib/delete-user.ts). Guards mirror
// PATCH plus "an instructor who still owns courses can't be deleted".
describe("DELETE /api/users/[id]", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let lesson: Awaited<ReturnType<typeof createLessonWithQuiz>>;
  const extra: string[] = [];

  beforeAll(async () => {
    [admin, instructor] = await Promise.all([createUser("ADMIN"), createUser("ADMIN")]);
    course = await createCourse(instructor.id);
    lesson = await createLessonWithQuiz(course.id);
  });

  afterAll(async () => {
    for (const id of extra) await cleanupUser(id);
    await cleanupCourse(course.id);
    await Promise.all([cleanupUser(admin.id), cleanupUser(instructor.id)]);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN", email: admin.email },
    } as never);
  });

  const call = (id: string) =>
    DELETE(new Request("http://localhost"), { params: Promise.resolve({ id }) });

  it("rejects a non-admin (403)", async () => {
    const s = await createUser("STUDENT");
    extra.push(s.id);
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: s.id, role: "STUDENT" } } as never);
    expect((await call(s.id)).status).toBe(403);
  });

  it("won't delete your own row (400)", async () => {
    expect((await call(admin.id)).status).toBe(400);
  });

  it("404s a missing user", async () => {
    expect((await call("nope")).status).toBe(404);
  });

  it("won't delete a super-admin unless the caller is one (403)", async () => {
    const sa = await createUser("ADMIN", { superAdmin: true });
    extra.push(sa.id);
    const res = await call(sa.id);
    expect(res.status).toBe(403);
    expect(await db.user.findUnique({ where: { id: sa.id } })).not.toBeNull();
  });

  it("won't delete an instructor who still owns courses (409)", async () => {
    const res = await call(instructor.id);
    expect(res.status).toBe(409);
    expect(await db.user.findUnique({ where: { id: instructor.id } })).not.toBeNull();
  });

  // Note: the "keep >=1 active ADMIN" guard in the route is defense-in-depth —
  // it's unreachable through the API (the caller is always an active admin who
  // isn't the target), so there's no route-level test for it, matching PATCH.

  it("hard-deletes a student and every row that points at them, leaving the rest intact", async () => {
    const [victim, bystander] = await Promise.all([createUser("STUDENT"), createUser("STUDENT")]);
    extra.push(bystander.id);

    await Promise.all([
      enroll(victim.id, course.id),
      enroll(bystander.id, course.id),
      db.lessonProgress.create({ data: { userId: victim.id, lessonId: lesson.lesson.id, completed: true } }),
      db.quizAttempt.create({ data: { userId: victim.id, quizId: lesson.quiz.id, score: 80 } }),
      db.certificate.create({ data: { userId: victim.id, courseId: course.id, serial: `t-${victim.id.slice(0, 12)}` } }),
      db.review.create({ data: { userId: victim.id, courseId: course.id, rating: 5 } }),
    ]);
    const targeted = await db.notification.create({ data: { targetUserId: victim.id, title: "x", body: "y" } });
    await db.notificationRead.create({ data: { notificationId: targeted.id, userId: victim.id } });

    const res = await call(victim.id);
    expect(res.status).toBe(200);

    const [u, enr, prog, cert, notif, bUser, bEnr] = await Promise.all([
      db.user.findUnique({ where: { id: victim.id } }),
      db.enrollment.count({ where: { userId: victim.id } }),
      db.lessonProgress.count({ where: { userId: victim.id } }),
      db.certificate.count({ where: { userId: victim.id } }),
      db.notification.count({ where: { id: targeted.id } }),
      db.user.findUnique({ where: { id: bystander.id } }),
      db.enrollment.count({ where: { userId: bystander.id } }),
    ]);
    expect(u).toBeNull();
    expect([enr, prog, cert, notif]).toEqual([0, 0, 0, 0]);
    expect(bUser).not.toBeNull(); // unrelated rows untouched
    expect(bEnr).toBe(1);
  });

  it("detaches (doesn't delete) broadcasts they authored and orders they reviewed", async () => {
    const [target, student] = await Promise.all([createUser("ADMIN"), createUser("STUDENT")]);
    extra.push(student.id);
    const [broadcast, order] = await Promise.all([
      db.notification.create({ data: { title: "b", body: "b", createdById: target.id } }),
      createCodeOrder(student.id, course.id),
    ]);
    await db.codeOrder.update({ where: { id: order.id }, data: { reviewedById: target.id } });

    const res = await call(target.id);
    expect(res.status).toBe(200);

    const [u, bAfter, oAfter] = await Promise.all([
      db.user.findUnique({ where: { id: target.id } }),
      db.notification.findUnique({ where: { id: broadcast.id } }),
      db.codeOrder.findUnique({ where: { id: order.id } }),
    ]);
    expect(u).toBeNull();
    expect(bAfter?.createdById).toBeNull();
    expect(oAfter?.reviewedById).toBeNull();
  });
});
