import { db } from "@/lib/db";

export type LessonFunnelRow = {
  moduleTitle: string;
  lessonTitle: string;
  completed: number;
  pct: number; // of enrolledCount
};

export type QuizStatRow = {
  lessonTitle: string;
  attempts: number;
  avgScore: number; // 0–100, rounded
  passRate: number; // 0–100, rounded (score >= 50)
};

export type CourseInsights = {
  courseTitle: string;
  enrolledCount: number;
  totalLessons: number;
  neverStarted: number; // enrolled but 0 lessons completed
  completedAll: number; // enrolled who finished every lesson
  funnel: LessonFunnelRow[];
  quizzes: QuizStatRow[];
};

/**
 * Where students stall: per-lesson completion counts (in course order) plus
 * quiz difficulty. Read-only aggregation over LessonProgress / QuizAttempt —
 * no per-question data exists, so quiz stats are quiz-level (avg score, pass
 * rate) only.
 */
export async function getCourseInsights(courseId: string): Promise<CourseInsights | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          title: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, quiz: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!course) return null;

  const lessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const lessonIds = lessons.map((l) => l.id);
  const quizByLesson = lessons
    .filter((l) => l.quiz)
    .map((l) => ({ quizId: l.quiz!.id, lessonTitle: l.title }));
  const quizIds = quizByLesson.map((q) => q.quizId);

  const [enrolledCount, progress, attempts] = await Promise.all([
    db.enrollment.count({ where: { courseId } }),
    lessonIds.length
      ? db.lessonProgress.findMany({
          where: { completed: true, lessonId: { in: lessonIds } },
          select: { userId: true, lessonId: true },
        })
      : Promise.resolve([]),
    quizIds.length
      ? db.quizAttempt.findMany({
          where: { quizId: { in: quizIds } },
          select: { quizId: true, score: true },
        })
      : Promise.resolve([]),
  ]);

  const completedByLesson = new Map<string, number>();
  const completedByUser = new Map<string, number>();
  for (const p of progress) {
    completedByLesson.set(p.lessonId, (completedByLesson.get(p.lessonId) ?? 0) + 1);
    completedByUser.set(p.userId, (completedByUser.get(p.userId) ?? 0) + 1);
  }

  const totalLessons = lessons.length;
  const startedUsers = completedByUser.size;
  const completedAll =
    totalLessons > 0
      ? [...completedByUser.values()].filter((n) => n >= totalLessons).length
      : 0;

  const funnel: LessonFunnelRow[] = lessons.map((l) => {
    const completed = completedByLesson.get(l.id) ?? 0;
    return {
      moduleTitle: l.moduleTitle,
      lessonTitle: l.title,
      completed,
      pct: enrolledCount > 0 ? Math.round((completed / enrolledCount) * 100) : 0,
    };
  });

  const attemptsByQuiz = new Map<string, number[]>();
  for (const a of attempts) {
    const arr = attemptsByQuiz.get(a.quizId) ?? [];
    arr.push(a.score);
    attemptsByQuiz.set(a.quizId, arr);
  }
  const quizzes: QuizStatRow[] = quizByLesson
    .map(({ quizId, lessonTitle }) => {
      const scores = attemptsByQuiz.get(quizId) ?? [];
      if (scores.length === 0) {
        return { lessonTitle, attempts: 0, avgScore: 0, passRate: 0 };
      }
      const sum = scores.reduce((s, v) => s + v, 0);
      const passed = scores.filter((v) => v >= 50).length;
      return {
        lessonTitle,
        attempts: scores.length,
        avgScore: Math.round(sum / scores.length),
        passRate: Math.round((passed / scores.length) * 100),
      };
    })
    .filter((q) => q.attempts > 0);

  return {
    courseTitle: course.title,
    enrolledCount,
    totalLessons,
    neverStarted: Math.max(0, enrolledCount - startedUsers),
    completedAll,
    funnel,
    quizzes,
  };
}
