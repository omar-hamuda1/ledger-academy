import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { LessonSidebar } from "@/components/course/LessonSidebar";
import { ResourceList } from "@/components/course/ResourceList";
import { MarkCompleteButton } from "@/components/course/MarkCompleteButton";

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

  return (
    <div dir="rtl" lang="ar" className="flex flex-1 bg-navy-950 text-slate-100">
      <LessonSidebar course={course} activeLessonId={lesson.id} completedLessonIds={completedLessonIds} />
      <div className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-extrabold text-white">{lesson.title}</h1>
        <VideoPlayer videoUrl={lesson.videoUrl} />
        {lesson.contentHtml && (
          <div
            className="prose prose-invert mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
          />
        )}
        <ResourceList resources={lesson.resources} />

        <MarkCompleteButton
          lessonId={lesson.id}
          initialCompleted={completedLessonIds.has(lesson.id)}
          nextLessonHref={nextLessonHref}
        />
      </div>
    </div>
  );
}
