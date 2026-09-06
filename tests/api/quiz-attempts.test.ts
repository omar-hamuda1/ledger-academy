import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/quizzes/[id]/attempts/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// Regression test for the quiz answer-key-leak / paywall-bypass fix
// (2026-09-06 security audit): POST /api/quizzes/[id]/attempts never
// checked the caller was enrolled, so anyone could take any quiz —
// including unpurchased courses' — and get correctId back for every
// question. It must now require an active enrollment first.
describe("POST /api/quizzes/[id]/attempts — enrollment paywall fix", () => {
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let enrolledStudent: Awaited<ReturnType<typeof createUser>>;
  let outsiderStudent: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let quizId: string;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    enrolledStudent = await createUser("STUDENT");
    outsiderStudent = await createUser("STUDENT");
    course = await createCourse(instructor.id, 500); // paid course
    const { quiz } = await createLessonWithQuiz(course.id);
    quizId = quiz.id;
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

  function request(answers: Record<string, string>) {
    return new Request("http://localhost/api/quizzes/x/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
  }

  it("rejects a user who never paid/enrolled in the course", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: outsiderStudent.id },
    } as never);
    const res = await POST(request({}), { params: Promise.resolve({ id: quizId }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    // Never leak question/answer data on the rejection path.
    expect(data.results).toBeUndefined();
  });

  it("lets an enrolled/paying student take the quiz and grades it server-side", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: enrolledStudent.id },
    } as never);
    const res = await POST(request({}), { params: Promise.resolve({ id: quizId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(1);
    expect(typeof data.score).toBe("number");
  });
});
