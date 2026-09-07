import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, Flame, Trophy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { calculateStreakDays, getAchievements } from "@/lib/gamification";
import { getSiteSettings } from "@/lib/site-settings";
import { GamificationWidget } from "@/components/dashboard/GamificationWidget";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { StudentCourseList, type StudentCourseItem } from "@/components/dashboard/StudentCourseList";

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

  const streakDays = calculateStreakDays(completedProgress.map((p) => p.updatedAt));
  const achievements = getAchievements(completedProgress.length, quizzesPassed, streakDays);

  const settings = await getSiteSettings();
  const announcement =
    settings.announcementActive && settings.announcement?.trim()
      ? settings.announcement.trim()
      : null;

  const courses: StudentCourseItem[] = enrollments.map((enrollment) => {
    const lessons = enrollment.course.modules.flatMap((module) => module.lessons);
    const completedCount = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
    const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

    const nextLesson = lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? lessons[0];
    const continueHref = nextLesson
      ? `/dashboard/student/courses/${enrollment.course.slug}/${nextLesson.id}`
      : null;

    return {
      id: enrollment.id,
      title: enrollment.course.title,
      percent,
      completedCount,
      totalLessons: lessons.length,
      continueHref,
    };
  });

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">
        أهلًا بك{session?.user?.name ? `، ${session.user.name}` : ""}
      </h1>
      <p className="mt-2 text-slate-400">تابع كورساتك وأكمل رحلتك في إدارة الأعمال.</p>

      {announcement && (
        <div className="mt-6">
          <AnnouncementBanner text={announcement} />
        </div>
      )}

      {enrollments.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 rounded-control border border-white/10 bg-navy-900/60 p-4 text-center shadow-card"
              >
                <stat.icon size={18} className="text-gold-400" />
                <p className="text-xl font-extrabold text-white">{stat.value}</p>
                <p className="text-[11px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <GamificationWidget streakDays={streakDays} achievements={achievements} />
        </>
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
        <StudentCourseList courses={courses} />
      )}
    </div>
  );
}
