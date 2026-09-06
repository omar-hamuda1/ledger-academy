import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DELETE } from "@/app/api/lessons/[id]/route";
import { createUser, createCourse, createLessonWithQuiz, enroll, cleanupCourse, cleanupUser } from "../helpers/fixtures";

// Regression test for the delete-lesson crash fix (2026-09-06 security
// audit): LessonProgress/Quiz have ON DELETE RESTRICT foreign keys to
// Lesson, so deleting a lesson that had student progress or a quiz
// attached used to throw an uncaught 500. The route must now clean up
// QuizAttempt -> Quiz and LessonProgress in a transaction first.
describe("DELETE /api/lessons/[id] — cascade-safe delete", () => {
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

  it("deletes a lesson that has real student progress and a quiz with attempts, without crashing", async () => {
    const { lesson, quiz } = await createLessonWithQuiz(course.id);
    await enroll(student.id, course.id);
    await db.lessonProgress.create({
      data: { userId: student.id, lessonId: lesson.id, completed: true },
    });
    await db.quizAttempt.create({ data: { userId: student.id, quizId: quiz.id, score: 100 } });

    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: lesson.id }),
    });

    expect(res.status).toBe(200);
    expect(await db.lesson.findUnique({ where: { id: lesson.id } })).toBeNull();
    expect(await db.quiz.findUnique({ where: { id: quiz.id } })).toBeNull();
  });

  it("rejects a non-admin caller", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: student.id, role: "STUDENT" },
    } as never);
    const { lesson } = await createLessonWithQuiz(course.id);
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: lesson.id }),
    });
    expect(res.status).toBe(403);
    // leftover lesson/quiz fixture is swept up by cleanupCourse() in afterAll
  });
});
