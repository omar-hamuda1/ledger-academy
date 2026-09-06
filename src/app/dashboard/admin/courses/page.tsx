import Link from "next/link";
import { GraduationCap, PlusCircle, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { EditCoursePriceForm } from "@/components/admin/EditCoursePriceForm";
import { Pagination } from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [courses, totalCount] = await Promise.all([
    db.course.findMany({
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { enrollments: true } } },
    }),
    db.course.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">إدارة الكورسات والأسعار</h1>
          <p className="mt-2 text-slate-400">
            تحكم في سعر كل كورس وحالة النشر الخاصة به بالجنيه المصري.
          </p>
        </div>
        <Link
          href="/dashboard/admin/courses/new"
          className="flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
        >
          <PlusCircle size={16} />
          إنشاء كورس جديد
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex flex-col gap-4 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card transition-shadow hover:shadow-elevated md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
                <GraduationCap size={22} />
              </span>
              <div>
                {course.grade && <p className="text-xs text-blue-400">{course.grade}</p>}
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white">{course.title}</h2>
                  <Link
                    href={`/dashboard/admin/courses/${course.id}/edit`}
                    aria-label="تعديل تفاصيل الكورس"
                    className="text-slate-400 transition hover:text-gold-400"
                  >
                    <Pencil size={14} />
                  </Link>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {course._count.enrollments} طالب مسجّل
                </p>
              </div>
            </div>

            <EditCoursePriceForm
              courseId={course.id}
              initialPrice={Number(course.price)}
              initialIsPublished={course.isPublished}
            />
          </div>
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/admin/courses" />
    </div>
  );
}
