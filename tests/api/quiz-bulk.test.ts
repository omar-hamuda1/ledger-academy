import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST } from "@/app/api/quizzes/bulk/route";
import { createUser, createCourse, createLessonWithQuiz, cleanupCourse, cleanupUser } from "../helpers/fixtures";

const HEADER = "question,option1,option2,option3,option4,correct";
const GOOD_CSV = [HEADER, "س1,أ,ب,ج,د,1", "س2,أ,ب,ج,د,B", "س3,أ,ب,ج,د,ج"].join("\n");

describe("POST /api/quizzes/bulk", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let courseId: string;
  let lessonWithQuizId: string;
  let quizId: string;
  let bareLessonId: string;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    student = await createUser("STUDENT");
    const course = await createCourse(admin.id);
    courseId = course.id;

    const built = await createLessonWithQuiz(courseId);
    lessonWithQuizId = built.lesson.id;
    quizId = built.quiz.id;

    const mod = await db.module.create({ data: { title: "M2", courseId, order: 2 } });
    const bare = await db.lesson.create({ data: { title: "L-bare", moduleId: mod.id, order: 1 } });
    bareLessonId = bare.id;
  });

  afterAll(async () => {
    await cleanupCourse(courseId);
    await cleanupUser(admin.id);
    await cleanupUser(student.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: admin.id, role: "ADMIN", email: admin.email },
    } as never);
  });

  const call = (body: unknown) =>
    POST(
      new Request("http://localhost/api/quizzes/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

  it("rejects a non-admin (403)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: student.id, role: "STUDENT" },
    } as never);
    const res = await call({ lessonId: bareLessonId, csv: GOOD_CSV });
    expect(res.status).toBe(403);
  });

  it("404s an unknown lesson", async () => {
    const res = await call({ lessonId: "nope", csv: GOOD_CSV });
    expect(res.status).toBe(404);
  });

  it("400s a file with a bad row and writes nothing", async () => {
    const before = await db.question.count({ where: { quizId } });
    const res = await call({
      lessonId: lessonWithQuizId,
      csv: [HEADER, "ok,أ,ب,ج,د,1", "bad,أ,,,,1"].join("\n"),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(Array.isArray(data.rowErrors)).toBe(true);
    expect(data.rowErrors.length).toBeGreaterThan(0);
    expect(await db.question.count({ where: { quizId } })).toBe(before);
  });

  it("creates the quiz for a lesson that has none, then adds the questions", async () => {
    expect(await db.quiz.findUnique({ where: { lessonId: bareLessonId } })).toBeNull();

    const res = await call({ lessonId: bareLessonId, csv: GOOD_CSV });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.created).toBe(3);

    const quiz = await db.quiz.findUnique({
      where: { lessonId: bareLessonId },
      include: { questions: true },
    });
    expect(quiz).not.toBeNull();
    expect(quiz!.questions).toHaveLength(3);
    expect(quiz!.questions.every((q) => q.correctId.startsWith("opt-"))).toBe(true);
  });

  it("append (default) adds on top of existing questions", async () => {
    const before = await db.question.count({ where: { quizId } });
    const res = await call({ lessonId: lessonWithQuizId, csv: GOOD_CSV });
    expect(res.status).toBe(201);
    expect(await db.question.count({ where: { quizId } })).toBe(before + 3);
  });

  it("replace clears existing questions first", async () => {
    const res = await call({ lessonId: lessonWithQuizId, csv: GOOD_CSV, mode: "replace" });
    expect(res.status).toBe(201);
    expect((await res.json()).created).toBe(3);
    expect(await db.question.count({ where: { quizId } })).toBe(3);
  });
});
