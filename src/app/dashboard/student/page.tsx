import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, Flame, Trophy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { calculateStreakDays, getAchievements } from "@/lib/gamification";
import { getSiteSettings } from "@/lib/site-settings";
import { GamificationWidget } from "@/components/dashboard/GamificationWidget";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { RedeemCodeForm } from "@/components/course/RedeemCodeForm";
import { CancelCodeOrderButton } from "@/components/course/CancelCodeOrderButton";
import { StudentCourseList, type StudentCourseItem } from "@/components/dashboard/StudentCourseList";
import { AvailableCourseCard, type AvailableCourse } from "@/components/dashboard/AvailableCourseCard";

export const dynamic = "force-dynamic";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function StudentHomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Only the fields this page actually reads — notably NOT lesson.contentHtml,
  // which can be large and was being pulled for every lesson in every enrolled
  // course just to count them.
  const enrollments = userId
    ? await db.enrollment.findMany({
        where: { userId },
        select: {
          id: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              modules: {
                orderBy: { order: "asc" },
                select: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
              },
            },
          },
        },
      })
    : [];

  const allLessonIds = enrollments.flatMap((enrollment) =>
    enrollment.course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id))
  );
  const enrolledCourseIds = enrollments.map((e) => e.course.id);

  const [completedProgress, quizzesPassed, codeOrders, certificates, availableRaw] = await Promise.all([
    userId
      ? db.lessonProgress.findMany({
          where: { userId, lessonId: { in: allLessonIds }, completed: true },
          select: { lessonId: true, updatedAt: true },
        })
      : Promise.resolve([]),
    // Just the number — was pulling every QuizAttempt row ever to count passes.
    userId ? db.quizAttempt.count({ where: { userId, score: { gte: 50 } } }) : Promise.resolve(0),
    userId
      ? db.codeOrder.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { course: { select: { title: true, slug: true } } },
        })
      : Promise.resolve([]),
    userId
      ? db.certificate.findMany({ where: { userId }, select: { courseId: true, serial: true } })
      : Promise.resolve([]),
    userId
      ? db.course.findMany({
          where: { isPublished: true, id: { notIn: enrolledCourseIds } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            grade: true,
            thumbnailUrl: true,
            price: true,
            modules: {
              select: { lessons: { select: { quiz: { select: { id: true } } } } },
            },
          },
        })
      : Promise.resolve([]),
  ]);
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));
  const certByCourse = new Map(certificates.map((c) => [c.courseId, c.serial]));
  const pendingOrderCourseIds = new Set(
    codeOrders.filter((o) => o.status === "PENDING").map((o) => o.courseId)
  );

  const availableCourses: AvailableCourse[] = availableRaw.map((c) => {
    const lessons = c.modules.flatMap((m) => m.lessons);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      grade: c.grade,
      thumbnailUrl: c.thumbnailUrl,
      price: Number(c.price),
      lessonCount: lessons.length,
      quizCount: lessons.filter((l) => l.quiz).length,
      pendingOrder: pendingOrderCourseIds.has(c.id),
    };
  });

  // Async Server Component: renders once per request, so reading the wall
  // clock here is correct. The react-hooks purity rule targets client
  // components / the React Compiler, where re-renders would make this unstable.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const completedThisWeek = completedProgress.filter(
    (p) => nowMs - p.updatedAt.getTime() < ONE_WEEK_MS
  ).length;

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
      courseId: enrollment.course.id,
      title: enrollment.course.title,
      percent,
      completedCount,
      totalLessons: lessons.length,
      continueHref,
      certSerial: certByCourse.get(enrollment.course.id) ?? null,
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

      {enrollments.length > 0 && (
        <>
          <h2 className="mt-8 mb-4 text-lg font-bold text-white">كورساتي</h2>
          <StudentCourseList courses={courses} />
        </>
      )}

      {/* Discover & get more courses without leaving the dashboard. */}
      <h2 className="mt-8 mb-4 text-lg font-bold text-white">
        {enrollments.length === 0 ? "ابدأ بأحد الكورسات" : "كورسات متاحة"}
      </h2>
      {availableCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-white/15 bg-navy-900/40 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
            <BookOpen size={22} />
          </span>
          <p className="text-sm text-slate-400">
            {enrollments.length === 0
              ? "لا توجد كورسات منشورة حاليًا — تابعنا قريبًا."
              : "أنت مسجّل في كل الكورسات المتاحة."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableCourses.map((course) => (
            <AvailableCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {codeOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-white">طلبات الأكواد</h2>
          <ul className="space-y-2">
            {codeOrders.map((order) => {
              const badge =
                order.status === "APPROVED"
                  ? { text: "تمت الموافقة — الكورس مُفعّل", cls: "bg-emerald-400/10 text-emerald-400" }
                  : order.status === "REJECTED"
                    ? { text: "مرفوض", cls: "bg-red-500/10 text-red-400" }
                    : { text: "قيد المراجعة", cls: "bg-gold-400/10 text-gold-400" };
              return (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-white/10 bg-navy-900/60 px-4 py-3 text-sm shadow-card"
                >
                  <div>
                    <Link
                      href={`/courses/${order.course.slug}`}
                      className="font-medium text-white hover:text-gold-400"
                    >
                      {order.course.title}
                    </Link>
                    {order.status === "REJECTED" && order.rejectionReason && (
                      <p className="mt-0.5 text-xs text-red-400">{order.rejectionReason}</p>
                    )}
                  </div>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
                      {badge.text}
                    </span>
                    {order.status === "PENDING" && <CancelCodeOrderButton orderId={order.id} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 max-w-md">
        <RedeemCodeForm />
      </div>
    </div>
  );
}
