import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DELETE } from "@/app/api/modules/[id]/route";
import { createUser, createCourse, createLessonWithQuiz, enroll, cleanupCourse, cleanupUser } from "../helpers/fixtures";

// Regression test for the delete-module crash fix (2026-09-06 security
// audit): deleting a module with any lesson that had progress or a quiz
// attached used to throw, mirroring the lesson-delete bug. The route must
// batch-clean QuizAttempt/Quiz/LessonProgress for every lesson in the
// module inside one transaction before deleting it.
describe("DELETE /api/modules/[id] — cascade-safe delete", () => {
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

  it("deletes a module whose lessons have progress and quiz attempts, without crashing", async () => {
    const { module, lesson: lesson1, quiz: quiz1 } = await createLessonWithQuiz(course.id);
    const { lesson: lesson2, quiz: quiz2 } = await createLessonWithQuiz(course.id);
    // second fixture created its own module too; force both lessons under the same module for this test
    await db.lesson.update({ where: { id: lesson2.id }, data: { moduleId: module.id } });

    await db.lessonProgress.create({ data: { userId: student.id, lessonId: lesson1.id, completed: true } });
    await db.lessonProgress.create({ data: { userId: student.id, lessonId: lesson2.id, completed: true } });
    await db.quizAttempt.create({ data: { userId: student.id, quizId: quiz1.id, score: 80 } });
    await db.quizAttempt.create({ data: { userId: student.id, quizId: quiz2.id, score: 60 } });

    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: module.id }),
    });

    expect(res.status).toBe(200);
    expect(await db.module.findUnique({ where: { id: module.id } })).toBeNull();
    expect(await db.lesson.findUnique({ where: { id: lesson1.id } })).toBeNull();
    expect(await db.lesson.findUnique({ where: { id: lesson2.id } })).toBeNull();

    // the now-empty second module (created alongside lesson2's original fixture) is
    // cleaned up by the course delete in afterAll via its Cascade relation
  });
});
