import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/progress/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// Regression test for the progress-IDOR fix (2026-09-06 security audit):
// POST /api/progress used to accept any lessonId with no ownership check,
// letting a user fabricate completion for lessons in courses they never
// bought. It must now require an active enrollment first.
describe("POST /api/progress — enrollment IDOR fix", () => {
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let enrolledStudent: Awaited<ReturnType<typeof createUser>>;
  let outsiderStudent: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let lessonId: string;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    enrolledStudent = await createUser("STUDENT");
    outsiderStudent = await createUser("STUDENT");
    course = await createCourse(instructor.id);
    const { lesson } = await createLessonWithQuiz(course.id);
    lessonId = lesson.id;
    await enroll(enrolledStudent.id, course.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(enrolledStudent.id);
    await cleanupUser(outsiderStudent.id);
    await cleanupUser(instructor.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  function request(body: unknown) {
    return new Request("http://localhost/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await POST(request({ lessonId, completed: true }));
    expect(res.status).toBe(401);
  });

  it("rejects a user who never enrolled in the course (the fixed IDOR)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: outsiderStudent.id },
    } as never);
    const res = await POST(request({ lessonId, completed: true }));
    expect(res.status).toBe(403);
  });

  it("accepts a genuinely enrolled user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: enrolledStudent.id },
    } as never);
    const res = await POST(request({ lessonId, completed: true, watchedSec: 30 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.progress.completed).toBe(true);
  });
});
