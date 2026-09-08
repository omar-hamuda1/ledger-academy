import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as issueCertificate } from "@/app/api/certificates/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// POST /api/certificates — a student claims their completion certificate once
// they've finished every lesson in an enrolled course. Idempotent.
describe("certificates", () => {
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let lessonId: string;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    student = await createUser("STUDENT");
    course = await createCourse(instructor.id, 200);
    const built = await createLessonWithQuiz(course.id);
    lessonId = built.lesson.id;
    await enroll(student.id, course.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(student.id);
    await cleanupUser(instructor.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  const asUser = (id: string | null) =>
    vi.mocked(getServerSession).mockResolvedValue(id ? ({ user: { id } } as never) : null);

  const call = (courseId: unknown) =>
    issueCertificate(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId }),
      }),
    );

  it("401 when not signed in", async () => {
    asUser(null);
    expect((await call(course.id)).status).toBe(401);
  });

  it("403 when not enrolled", async () => {
    const outsider = await createUser("STUDENT");
    asUser(outsider.id);
    expect((await call(course.id)).status).toBe(403);
    await cleanupUser(outsider.id);
  });

  it("400 when the course isn't fully complete", async () => {
    asUser(student.id);
    const res = await call(course.id);
    expect(res.status).toBe(400);
    expect(
      await db.certificate.findUnique({
        where: { userId_courseId: { userId: student.id, courseId: course.id } },
      }),
    ).toBeNull();
  });

  it("issues once complete, then is idempotent", async () => {
    await db.lessonProgress.create({
      data: { userId: student.id, lessonId, completed: true },
    });

    asUser(student.id);
    const first = await call(course.id);
    expect(first.status).toBe(201);
    const { serial } = await first.json();
    expect(serial).toMatch(/^LA-[2-9A-Z]{5}-[2-9A-Z]{5}$/);

    asUser(student.id);
    const second = await call(course.id);
    expect(second.status).toBe(200);
    const data2 = await second.json();
    expect(data2.serial).toBe(serial);
    expect(data2.alreadyIssued).toBe(true);

    expect(await db.certificate.count({ where: { userId: student.id, courseId: course.id } })).toBe(1);
  });
});
