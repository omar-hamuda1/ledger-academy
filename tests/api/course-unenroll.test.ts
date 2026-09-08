import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as unenroll } from "@/app/api/courses/[id]/unenroll/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// POST /api/courses/[id]/unenroll — admin removes a student from a course.
// Hard delete of the enrollment + that course's progress/attempts for the user.
describe("course unenroll", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let lessonId: string;
  let quizId: string;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    student = await createUser("STUDENT");
    course = await createCourse(admin.id, 200);
    const built = await createLessonWithQuiz(course.id);
    lessonId = built.lesson.id;
    quizId = built.quiz.id;
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(student.id);
    await cleanupUser(admin.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  const asAdmin = () =>
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: admin.id, role: "ADMIN" } } as never);
  const asUser = (id: string) =>
    vi.mocked(getServerSession).mockResolvedValue({ user: { id } } as never);

  const call = (courseId: string, body: unknown) =>
    unenroll(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: courseId }) },
    );

  it("rejects a non-admin", async () => {
    asUser(student.id);
    const res = await call(course.id, { userId: student.id });
    expect(res.status).toBe(403);
  });

  it("404s when the student isn't enrolled", async () => {
    asAdmin();
    const res = await call(course.id, { userId: student.id });
    expect(res.status).toBe(404);
  });

  it("removes the enrollment and wipes that course's progress + attempts", async () => {
    await enroll(student.id, course.id);
    await db.lessonProgress.create({
      data: { userId: student.id, lessonId, completed: true },
    });
    await db.quizAttempt.create({ data: { userId: student.id, quizId, score: 100 } });

    asAdmin();
    const res = await call(course.id, { userId: student.id });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.lessonsWiped).toBe(1);
    expect(data.attemptsWiped).toBe(1);

    expect(
      await db.enrollment.findUnique({
        where: { userId_courseId: { userId: student.id, courseId: course.id } },
      }),
    ).toBeNull();
    expect(
      await db.lessonProgress.count({ where: { userId: student.id, lessonId } }),
    ).toBe(0);
    expect(await db.quizAttempt.count({ where: { userId: student.id, quizId } })).toBe(0);
  });

  it("lets the student re-enroll cleanly afterwards", async () => {
    const again = await enroll(student.id, course.id);
    expect(again.id).toBeTruthy();
  });
});
