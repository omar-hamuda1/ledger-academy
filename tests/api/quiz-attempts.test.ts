import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/quizzes/[id]/attempts/route";
import { POST as START } from "@/app/api/quizzes/[id]/start/route";
import { db } from "@/lib/db";
import { signQuizStart } from "@/lib/quiz-timer";
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

// Server-enforced timer (src/lib/quiz-timer.ts). A timed quiz needs a valid,
// unexpired HMAC start token on the submission; the client countdown alone is
// not trusted.
describe("POST /api/quizzes/[id]/attempts — timed quiz", () => {
  const LIMIT = 600;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let outsider: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let quizId: string;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    student = await createUser("STUDENT");
    outsider = await createUser("STUDENT");
    course = await createCourse(instructor.id);
    const { quiz } = await createLessonWithQuiz(course.id);
    quizId = quiz.id;
    await db.quiz.update({ where: { id: quizId }, data: { timeLimitSec: LIMIT } });
    await enroll(student.id, course.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await Promise.all([cleanupUser(student.id), cleanupUser(outsider.id), cleanupUser(instructor.id)]);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: student.id } } as never);
  });

  const submit = (body: unknown) =>
    POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: quizId }) },
    );

  it("accepts a submission with a fresh start token", async () => {
    const res = await submit({ answers: {}, startToken: signQuizStart(quizId, student.id) });
    expect(res.status).toBe(200);
  });

  it("rejects a submission with no start token (400)", async () => {
    const res = await submit({ answers: {} });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("وقت");
  });

  it("rejects a tampered / unparseable token (400)", async () => {
    const res = await submit({ answers: {}, startToken: "not.a.real.token" });
    expect(res.status).toBe(400);
  });

  it("rejects a token minted longer ago than the limit + grace (400)", async () => {
    const stale = signQuizStart(quizId, student.id, Date.now() - (LIMIT + 120) * 1000);
    const res = await submit({ answers: {}, startToken: stale });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("انتهى");
  });

  it("rejects a token bound to a different user (400)", async () => {
    const res = await submit({ answers: {}, startToken: signQuizStart(quizId, outsider.id) });
    expect(res.status).toBe(400);
  });

  it("POST /start gives an enrolled student a token, 403s an outsider", async () => {
    const ok = await START(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: quizId }),
    });
    expect(ok.status).toBe(200);
    expect(typeof (await ok.json()).startToken).toBe("string");

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: outsider.id } } as never);
    const denied = await START(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id: quizId }),
    });
    expect(denied.status).toBe(403);
  });
});
