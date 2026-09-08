import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { LessonSidebar, MobileLessonNav } from "@/components/course/LessonSidebar";
import { LessonWorkspacePanel } from "@/components/course/LessonWorkspacePanel";
import { MarkCompleteButton } from "@/components/course/MarkCompleteButton";
import { LessonQA } from "@/components/course/LessonQA";
import { getLessonQA } from "@/lib/lesson-qa";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const course = await db.course.findUnique({
    where: { slug },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  if (!course) notFound();

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) redirect(`/courses/${slug}`);

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, module: { courseId: course.id } },
    include: { resources: true },
  });
  if (!lesson) notFound();

  const allLessons = course.modules.flatMap((module) => module.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined;
  const nextLessonHref = nextLesson
    ? `/dashboard/student/courses/${slug}/${nextLesson.id}`
    : null;

  const progressRecords = await db.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: allLessons.map((l) => l.id) },
      completed: true,
    },
  });
  const completedLessonIds = new Set(progressRecords.map((p) => p.lessonId));

  const [settings, qaThreads, thisProgress] = await Promise.all([
    getSiteSettings(),
    getLessonQA(lesson.id),
    db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      select: { watchedSec: true, completed: true },
    }),
  ]);

  return (
    <div dir="rtl" lang="ar" className="flex flex-1 bg-navy-950 text-slate-100">
      <LessonSidebar course={course} activeLessonId={lesson.id} completedLessonIds={completedLessonIds} />
      <div className="flex-1 p-4 pb-24 sm:p-6 md:p-8">
        <MobileLessonNav
          course={course}
          activeLessonId={lesson.id}
          completedLessonIds={completedLessonIds}
        />
        <h1 className="text-2xl font-extrabold text-white">{lesson.title}</h1>
        <VideoPlayer
          videoUrl={lesson.videoUrl}
          lessonId={lesson.id}
          initialSec={thisProgress?.watchedSec ?? 0}
          initialCompleted={thisProgress?.completed ?? false}
        />
        {lesson.contentHtml && (
          <div
            className="prose prose-invert mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
          />
        )}

        <MarkCompleteButton
          lessonId={lesson.id}
          initialCompleted={completedLessonIds.has(lesson.id)}
          nextLessonHref={nextLessonHref}
        />

        <LessonQA
          lessonId={lesson.id}
          currentUserId={userId}
          isAdmin={session?.user?.role === "ADMIN"}
          threads={qaThreads}
        />
      </div>

      <LessonWorkspacePanel
        resources={lesson.resources}
        showBreakEven={settings.showBreakEvenTool}
        showSwot={settings.showSwotTool}
      />
    </div>
  );
}
