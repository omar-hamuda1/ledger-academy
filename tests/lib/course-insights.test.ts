import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { db } from "@/lib/db";
import { getCourseInsights } from "@/lib/course-insights";
import {
  createUser,
  createCourse,
  createLessonWithQuiz,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// getCourseInsights — per-lesson completion funnel + quiz stats for a course.
describe("getCourseInsights", () => {
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let a: Awaited<ReturnType<typeof createUser>>;
  let b: Awaited<ReturnType<typeof createUser>>;
  let c: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;
  let l1: string, l2: string, l3: string, quizId: string;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    a = await createUser("STUDENT");
    b = await createUser("STUDENT");
    c = await createUser("STUDENT");
    course = await createCourse(instructor.id, 100);

    const built = await createLessonWithQuiz(course.id); // module + lesson1 + quiz
    l1 = built.lesson.id;
    quizId = built.quiz.id;
    l2 = (
      await db.lesson.create({
        data: { title: "Lesson 2", moduleId: built.module.id, order: 2 },
      })
    ).id;
    l3 = (
      await db.lesson.create({
        data: { title: "Lesson 3", moduleId: built.module.id, order: 3 },
      })
    ).id;

    for (const u of [a, b, c]) await enroll(u.id, course.id);

    // A: finishes everything + takes the quiz
    for (const lid of [l1, l2, l3]) {
      await db.lessonProgress.create({ data: { userId: a.id, lessonId: lid, completed: true } });
    }
    await db.quizAttempt.create({ data: { userId: a.id, quizId, score: 80 } });

    // B: only lesson 1
    await db.lessonProgress.create({ data: { userId: b.id, lessonId: l1, completed: true } });

    // C: nothing
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    for (const u of [a, b, c, instructor]) await cleanupUser(u.id);
  });

  it("returns null for a missing course", async () => {
    expect(await getCourseInsights("does-not-exist")).toBeNull();
  });

  it("computes enrollment, never-started, completed-all", async () => {
    const d = (await getCourseInsights(course.id))!;
    expect(d.enrolledCount).toBe(3);
    expect(d.totalLessons).toBe(3);
    expect(d.neverStarted).toBe(1); // C
    expect(d.completedAll).toBe(1); // A
  });

  it("builds the per-lesson funnel in order", async () => {
    const d = (await getCourseInsights(course.id))!;
    expect(d.funnel.map((f) => f.completed)).toEqual([2, 1, 1]);
    expect(d.funnel[0].pct).toBe(67); // 2/3
    expect(d.funnel[0].lessonTitle).toBe("Test Lesson");
  });

  it("reports quiz stats only for attempted quizzes", async () => {
    const d = (await getCourseInsights(course.id))!;
    expect(d.quizzes).toHaveLength(1);
    expect(d.quizzes[0]).toMatchObject({ attempts: 1, avgScore: 80, passRate: 100 });
  });
});
