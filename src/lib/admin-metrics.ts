import { db } from "@/lib/db";

/**
 * All admin-dashboard aggregates in one place so the page component stays a
 * thin data-fetch. Everything here is computed from existing rows
 * (`Enrollment`, `LessonProgress`, `QuizAttempt`, `Course`) — no schema
 * changes, no fabricated numbers.
 *
 * Note: lesson "activity" is bucketed by `LessonProgress.updatedAt`, which is
 * an `@updatedAt` column, so it tracks the *last* time a progress row moved,
 * not strictly the completion moment. The student dashboard already uses the
 * same approximation for its "this week" stat — kept consistent on purpose.
 */

const WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type WeeklyActivityPoint = {
  /** Short Arabic label for the week's start date, e.g. "٥ سبت". */
  label: string;
  enrollments: number;
  completions: number;
};

export type CoursePopularityPoint = {
  title: string;
  enrollments: number;
};

export type AdminMetrics = {
  studentCount: number;
  courseCount: number;
  publishedCourseCount: number;
  totalEnrollments: number;
  completedLessonsCount: number;
  quizAttemptsCount: number;
  quizPassCount: number;
  avgQuizScore: number;
  newStudentsThisWeek: number;
  enrollmentsThisWeek: number;
  pendingCodeOrders: number;
  weeklyActivity: WeeklyActivityPoint[];
  coursePopularity: CoursePopularityPoint[];
};

const weekLabelFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
});

/** Midnight of the Monday that starts the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date();
  const firstWeekStart = startOfWeek(new Date(now.getTime() - (WEEKS - 1) * WEEK_MS));
  const oneWeekAgo = new Date(now.getTime() - WEEK_MS);

  const [
    studentCount,
    courseCount,
    publishedCourseCount,
    totalEnrollments,
    completedLessonsCount,
    quizAttemptsCount,
    quizAgg,
    quizPassCount,
    newStudentsThisWeek,
    enrollmentsThisWeek,
    pendingCodeOrders,
    recentEnrollments,
    recentCompletions,
    courses,
  ] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.course.count(),
    db.course.count({ where: { isPublished: true } }),
    db.enrollment.count(),
    db.lessonProgress.count({ where: { completed: true } }),
    db.quizAttempt.count(),
    db.quizAttempt.aggregate({ _avg: { score: true } }),
    db.quizAttempt.count({ where: { score: { gte: 50 } } }),
    db.user.count({ where: { role: "STUDENT", createdAt: { gte: oneWeekAgo } } }),
    db.enrollment.count({ where: { enrolledAt: { gte: oneWeekAgo } } }),
    db.codeOrder.count({ where: { status: "PENDING" } }),
    db.enrollment.findMany({
      where: { enrolledAt: { gte: firstWeekStart } },
      select: { enrolledAt: true },
    }),
    db.lessonProgress.findMany({
      where: { completed: true, updatedAt: { gte: firstWeekStart } },
      select: { updatedAt: true },
    }),
    db.course.findMany({
      select: { title: true, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: "desc" } },
      take: 6,
    }),
  ]);

  // Build the 8 week buckets up front, then drop each row into its bucket.
  const buckets: WeeklyActivityPoint[] = Array.from({ length: WEEKS }, (_, i) => ({
    label: weekLabelFormatter.format(new Date(firstWeekStart.getTime() + i * WEEK_MS)),
    enrollments: 0,
    completions: 0,
  }));

  const bucketIndex = (d: Date) =>
    Math.floor((d.getTime() - firstWeekStart.getTime()) / WEEK_MS);

  for (const { enrolledAt } of recentEnrollments) {
    const i = bucketIndex(enrolledAt);
    if (i >= 0 && i < WEEKS) buckets[i].enrollments += 1;
  }
  for (const { updatedAt } of recentCompletions) {
    const i = bucketIndex(updatedAt);
    if (i >= 0 && i < WEEKS) buckets[i].completions += 1;
  }

  return {
    studentCount,
    courseCount,
    publishedCourseCount,
    totalEnrollments,
    completedLessonsCount,
    quizAttemptsCount,
    quizPassCount,
    avgQuizScore: Math.round(quizAgg._avg.score ?? 0),
    newStudentsThisWeek,
    enrollmentsThisWeek,
    pendingCodeOrders,
    weeklyActivity: buckets,
    coursePopularity: courses.map((c) => ({
      title: c.title,
      enrollments: c._count.enrollments,
    })),
  };
}
