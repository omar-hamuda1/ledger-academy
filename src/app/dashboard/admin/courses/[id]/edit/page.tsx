import Link from "next/link";
import { requireScopePage } from "@/lib/require-admin";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { EditCourseDetailsForm } from "@/components/admin/EditCourseDetailsForm";
import { CourseRoster, type RosterRow } from "@/components/admin/CourseRoster";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireScopePage("courses");
  const { id } = await params;
  const course = await db.course.findUnique({ where: { id } });
  if (!course) notFound();

  const enrollments = await db.enrollment.findMany({
    where: { courseId: id },
    orderBy: { enrolledAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const roster: RosterRow[] = enrollments.map((e) => ({
    userId: e.user.id,
    name: e.user.name,
    email: e.user.email,
    enrolledAt: e.enrolledAt.getTime(),
  }));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <Link
        href="/dashboard/admin/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-gold-400"
      >
        <ArrowRight size={16} />
        العودة إلى إدارة الكورسات
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">تعديل الكورس</h1>
          <p className="mt-2 text-slate-400">{course.title}</p>
        </div>
        <Link
          href={`/dashboard/admin/courses/${course.id}/insights`}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-gold-400/40 hover:text-gold-400"
        >
          <BarChart3 size={16} />
          تحليل تقدّم الطلاب
        </Link>
      </div>

      <div className="mt-8 max-w-xl">
        <EditCourseDetailsForm
          courseId={course.id}
          initialTitle={course.title}
          initialDescription={course.description}
          initialGrade={course.grade}
          initialThumbnailUrl={course.thumbnailUrl}
          initialPrice={Number(course.price)}
          initialIsPublished={course.isPublished}
        />
      </div>

      <div className="max-w-3xl">
        <CourseRoster courseId={course.id} rows={roster} />
      </div>
    </div>
  );
}
