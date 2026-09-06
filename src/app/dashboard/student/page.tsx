import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, PlayCircle, Flame, Trophy, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function StudentHomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const enrollments = userId
    ? await db.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: { lessons: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      })
    : [];

  const allLessonIds = enrollments.flatMap((enrollment) =>
    enrollment.course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id))
  );

  const [completedProgress, quizAttempts] = await Promise.all([
    userId
      ? db.lessonProgress.findMany({
          where: { userId, lessonId: { in: allLessonIds }, completed: true },
        })
      : Promise.resolve([]),
    userId ? db.quizAttempt.findMany({ where: { userId } }) : Promise.resolve([]),
  ]);
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  const completedThisWeek = completedProgress.filter(
    (p) => Date.now() - p.updatedAt.getTime() < ONE_WEEK_MS
  ).length;
  const quizzesPassed = quizAttempts.filter((a) => a.score >= 50).length;

  const stats = [
    { icon: CheckCircle2, value: completedProgress.length, label: "درس مكتمل" },
    { icon: Flame, value: completedThisWeek, label: "درس هذا الأسبوع" },
    { icon: Trophy, value: quizzesPassed, label: "اختبار ناجح" },
  ];

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">
        أهلًا بك{session?.user?.name ? `، ${session.user.name}` : ""}
      </h1>
      <p className="mt-2 text-slate-400">تابع كورساتك وأكمل رحلتك في إدارة الأعمال.</p>

      {enrollments.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-control border border-white/10 bg-navy-900/60 p-4 text-center shadow-card"
            >
              <stat.icon size={18} className="text-gold-400" />
              <p className="text-xl font-extrabold text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 mb-4 text-lg font-bold text-white">كورساتي</h2>
      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-white/15 bg-navy-900/40 p-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
            <BookOpen size={22} />
          </span>
          <p className="font-semibold text-white">أنت غير مسجل في أي كورس بعد</p>
          <Link
            href="/courses"
            className="mt-2 rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
          >
            تصفح الكورسات
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const lessons = enrollment.course.modules.flatMap((module) => module.lessons);
            const completedCount = lessons.filter((lesson) =>
              completedLessonIds.has(lesson.id)
            ).length;
            const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

            const nextLesson =
              lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? lessons[0];
            const continueHref = nextLesson
              ? `/dashboard/student/courses/${enrollment.course.slug}/${nextLesson.id}`
              : null;

            return (
              <li
                key={enrollment.id}
                className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/30 hover:shadow-elevated"
              >
                <h3 className="font-bold text-white">{enrollment.course.title}</h3>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                    <span>{percent}% مكتمل</span>
                    <span>
                      {completedCount} / {lessons.length} درس
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gold-400 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {continueHref && (
                  <Link
                    href={continueHref}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gold-400 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
                  >
                    <PlayCircle size={16} />
                    متابعة التعلم
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
