import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { EditCourseDetailsForm } from "@/components/admin/EditCourseDetailsForm";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await db.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <Link
        href="/dashboard/admin/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-gold-400"
      >
        <ArrowRight size={16} />
        العودة إلى إدارة الكورسات
      </Link>

      <h1 className="text-2xl font-extrabold text-white">تعديل الكورس</h1>
      <p className="mt-2 text-slate-400">{course.title}</p>

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
    </div>
  );
}
