import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DELETE } from "@/app/api/quizzes/[id]/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// DELETE /api/quizzes/[id] — the admin UI gained a "delete quiz" button
// 2026-09-07. QuizAttempt → Quiz is ON DELETE RESTRICT, so the route must
// clear attempts first (in a transaction); Question → Quiz cascades.
describe("DELETE /api/quizzes/[id]", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    instructor = await createUser("ADMIN");
    student = await createUser("STUDENT");
    course = await createCourse(instructor.id);
    await enroll(student.id, course.id);
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

  it("deletes a quiz with questions and attempts, leaving nothing behind", async () => {
    const { quiz, question } = await createLessonWithQuiz(course.id);
    await db.quizAttempt.create({ data: { userId: student.id, quizId: quiz.id, score: 90 } });

    const res = await call(quiz.id);
    expect(res.status).toBe(200);
    expect(await db.quiz.findUnique({ where: { id: quiz.id } })).toBeNull();
    expect(await db.question.findUnique({ where: { id: question.id } })).toBeNull();
    expect(await db.quizAttempt.count({ where: { quizId: quiz.id } })).toBe(0);
  });

  it("returns 404 for a missing quiz", async () => {
    expect((await call("nope")).status).toBe(404);
  });

  it("rejects a non-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: student.id, role: "STUDENT" },
    } as never);
    const { quiz } = await createLessonWithQuiz(course.id);
    expect((await call(quiz.id)).status).toBe(403);
    expect(await db.quiz.findUnique({ where: { id: quiz.id } })).not.toBeNull();
  });
});
