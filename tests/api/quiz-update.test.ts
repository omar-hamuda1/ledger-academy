import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { PATCH } from "@/app/api/quizzes/[id]/route";
import { createUser, createCourse, createLessonWithQuiz, cleanupCourse, cleanupUser } from "../helpers/fixtures";

// PATCH /api/quizzes/[id] — sets the optional countdown (timeLimitSec).
describe("PATCH /api/quizzes/[id]", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let quizId: string;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    student = await createUser("STUDENT");
    course = await createCourse(admin.id);
    quizId = (await createLessonWithQuiz(course.id)).quiz.id;
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(admin.id);
    await cleanupUser(student.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN", email: admin.email },
    } as never);
  });

  const call = (id: string, body: unknown) =>
    PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("sets then clears the time limit", async () => {
    const set = await call(quizId, { timeLimitSec: 600 });
    expect(set.status).toBe(200);
    expect((await db.quiz.findUnique({ where: { id: quizId } }))!.timeLimitSec).toBe(600);

    const clear = await call(quizId, { timeLimitSec: null });
    expect(clear.status).toBe(200);
    expect((await db.quiz.findUnique({ where: { id: quizId } }))!.timeLimitSec).toBeNull();
  });

  it("rejects out-of-range or non-integer values (400)", async () => {
    for (const v of [30, 4 * 60 * 60, 12.5]) {
      const res = await call(quizId, { timeLimitSec: v });
      expect(res.status).toBe(400);
    }
    expect((await db.quiz.findUnique({ where: { id: quizId } }))!.timeLimitSec).toBeNull();
  });

  it("404s a missing quiz", async () => {
    expect((await call("nope", { timeLimitSec: 300 })).status).toBe(404);
  });

  it("rejects a non-admin (403)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: student.id, role: "STUDENT" },
    } as never);
    expect((await call(quizId, { timeLimitSec: 300 })).status).toBe(403);
  });
});
