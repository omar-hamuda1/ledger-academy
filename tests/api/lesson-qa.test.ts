import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as ask } from "@/app/api/lessons/[id]/questions/route";
import { POST as answer } from "@/app/api/lesson-questions/[id]/answers/route";
import { DELETE as delQuestion } from "@/app/api/lesson-questions/[id]/route";
import { DELETE as delAnswer } from "@/app/api/lesson-answers/[id]/route";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

describe("lesson Q&A", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let outsider: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let lessonId: string;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    student = await createUser("STUDENT");
    outsider = await createUser("STUDENT");
    course = await createCourse(admin.id, 100);
    lessonId = (await createLessonWithQuiz(course.id)).lesson.id;
    await enroll(student.id, course.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    for (const u of [student, outsider, admin]) await cleanupUser(u.id);
  });

  beforeEach(() => vi.mocked(getServerSession).mockReset());
  const as = (u: { id: string } | null, role: "ADMIN" | "STUDENT" = "STUDENT") =>
    vi.mocked(getServerSession).mockResolvedValue(u ? ({ user: { id: u.id, role } } as never) : null);

  const askReq = (id: string, body: unknown) =>
    ask(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
  const answerReq = (id: string, body: unknown) =>
    answer(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
  const delQ = (id: string) => delQuestion(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ id }) });
  const delA = (id: string) => delAnswer(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ id }) });

  it("blocks a non-enrolled user from asking", async () => {
    as(outsider);
    expect((await askReq(lessonId, { body: "سؤال؟" })).status).toBe(403);
  });

  it("an enrolled student asks; the instructor answers with the badge", async () => {
    as(student);
    const r = await askReq(lessonId, { body: "ما الفرق بين الربح والإيراد؟" });
    expect(r.status).toBe(201);
    const { question } = await r.json();

    as(admin, "ADMIN");
    const ans = await answerReq(question.id, { body: "الإيراد إجمالي المبيعات، والربح بعد خصم المصروفات." });
    expect(ans.status).toBe(201);
    const { answer: a } = await ans.json();
    expect(a.byInstructor).toBe(true);

    // asker got notified
    const note = await db.notification.findFirst({ where: { targetUserId: student.id } });
    expect(note?.title).toContain("المحاضر");
  });

  it("a student's own answer is not badged; outsiders can't answer", async () => {
    as(student);
    const q = await (await askReq(lessonId, { body: "متى يبدأ الفصل الثاني؟" })).json();

    as(outsider);
    expect((await answerReq(q.question.id, { body: "لا أعرف" })).status).toBe(403);

    as(student);
    const ans = await (await answerReq(q.question.id, { body: "أظنه بعد الاختبار." })).json();
    expect(ans.answer.byInstructor).toBe(false);
  });

  it("owner deletes their question (answers cascade); a stranger cannot", async () => {
    as(student);
    const q = (await (await askReq(lessonId, { body: "سؤال سيُحذف لاحقًا" })).json()).question;
    as(admin, "ADMIN");
    const a = (await (await answerReq(q.id, { body: "رد" })).json()).answer;

    as(outsider);
    expect((await delQ(q.id)).status).toBe(403);

    as(student);
    expect((await delQ(q.id)).status).toBe(200);
    expect(await db.lessonQuestion.count({ where: { id: q.id } })).toBe(0);
    expect(await db.lessonAnswer.count({ where: { id: a.id } })).toBe(0);
  });

  it("admin can delete any answer", async () => {
    as(student);
    const q = (await (await askReq(lessonId, { body: "سؤال آخر" })).json()).question;
    const a = (await (await answerReq(q.id, { body: "رد الطالب" })).json()).answer;

    as(admin, "ADMIN");
    expect((await delA(a.id)).status).toBe(200);
    expect(await db.lessonAnswer.count({ where: { id: a.id } })).toBe(0);
  });
});
