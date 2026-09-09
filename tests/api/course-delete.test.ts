import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DELETE } from "@/app/api/courses/[id]/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  createPrepaidCode,
  createCodeOrder,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// DELETE /api/courses/[id] — hard delete (src/lib/delete-course.ts). Clears the
// RESTRICT relations (enrollments, progress, quizzes, attempts) then lets the
// DB cascade the rest.
describe("DELETE /api/courses/[id]", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let other: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    [admin, instructor, student] = await Promise.all([
      createUser("ADMIN"),
      createUser("ADMIN"),
      createUser("STUDENT"),
    ]);
    other = await createCourse(instructor.id);
    await enroll(student.id, other.id);
  });

  afterAll(async () => {
    await cleanupCourse(other.id).catch(() => {});
    await Promise.all([
      cleanupUser(admin.id),
      cleanupUser(instructor.id),
      cleanupUser(student.id),
    ]);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN", email: admin.email },
    } as never);
  });

  const call = (id: string) =>
    DELETE(new Request("http://localhost"), { params: Promise.resolve({ id }) });

  it("rejects an admin restricted from the courses scope (403)", async () => {
    const restricted = await createUser("ADMIN", { restrictedScopes: ["courses"] });
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: restricted.id, role: "ADMIN", email: restricted.email },
    } as never);
    expect((await call(other.id)).status).toBe(403);
    expect(await db.course.findUnique({ where: { id: other.id } })).not.toBeNull();
    await cleanupUser(restricted.id);
  });

  it("404s a missing course", async () => {
    expect((await call("nope")).status).toBe(404);
  });

  it("deletes the course and every row under it, leaving other courses intact", async () => {
    const course = await createCourse(instructor.id);
    const { module: mod, lesson, quiz, question } = await createLessonWithQuiz(course.id);

    await Promise.all([
      enroll(student.id, course.id),
      db.lessonProgress.create({ data: { userId: student.id, lessonId: lesson.id, completed: true } }),
      db.quizAttempt.create({ data: { userId: student.id, quizId: quiz.id, score: 90 } }),
      db.certificate.create({ data: { userId: student.id, courseId: course.id, serial: `t-${course.id.slice(0, 12)}` } }),
      db.review.create({ data: { userId: student.id, courseId: course.id, rating: 4 } }),
      createPrepaidCode(course.id),
    ]);
    const q = await db.lessonQuestion.create({ data: { lessonId: lesson.id, userId: student.id, body: "?" } });
    await db.lessonAnswer.create({ data: { questionId: q.id, userId: instructor.id, body: "!", byInstructor: true } });
    await createCodeOrder(student.id, course.id);

    const res = await call(course.id);
    expect(res.status).toBe(200);

    const [
      courseRow, modRow, lessonRow, quizRow, questionRow, attempts, progress,
      enrollments, certs, reviews, codes, orders, questions,
    ] = await Promise.all([
      db.course.findUnique({ where: { id: course.id } }),
      db.module.count({ where: { id: mod.id } }),
      db.lesson.count({ where: { id: lesson.id } }),
      db.quiz.count({ where: { id: quiz.id } }),
      db.question.count({ where: { id: question.id } }),
      db.quizAttempt.count({ where: { quizId: quiz.id } }),
      db.lessonProgress.count({ where: { lessonId: lesson.id } }),
      db.enrollment.count({ where: { courseId: course.id } }),
      db.certificate.count({ where: { courseId: course.id } }),
      db.review.count({ where: { courseId: course.id } }),
      db.prepaidCode.count({ where: { courseId: course.id } }),
      db.codeOrder.count({ where: { courseId: course.id } }),
      db.lessonQuestion.count({ where: { lessonId: lesson.id } }),
    ]);
    expect(courseRow).toBeNull();
    expect([
      modRow, lessonRow, quizRow, questionRow, attempts, progress,
      enrollments, certs, reviews, codes, orders, questions,
    ]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    // unrelated course + its enrollment untouched; the users survive
    expect(await db.course.findUnique({ where: { id: other.id } })).not.toBeNull();
    expect(await db.enrollment.count({ where: { courseId: other.id } })).toBe(1);
    expect(await db.user.findUnique({ where: { id: student.id } })).not.toBeNull();
    expect(await db.user.findUnique({ where: { id: instructor.id } })).not.toBeNull();

    const audit = await db.auditLog.findFirst({
      where: { action: "course.delete", targetId: course.id },
    });
    expect(audit).not.toBeNull();
    expect((audit!.metadata as { slug?: string }).slug).toBe(course.slug);
  });
});
