import { Download } from "lucide-react";
import { requireScopePage } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { Pagination } from "@/components/admin/Pagination";
import { GeneratePrepaidCodesForm } from "@/components/admin/GeneratePrepaidCodesForm";
import { PrepaidCodesFilters } from "@/components/admin/PrepaidCodesFilters";
import {
  PrepaidCodesTable,
  type PrepaidCodeRow,
} from "@/components/admin/PrepaidCodesTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminPrepaidCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; status?: string; page?: string }>;
}) {
  await requireScopePage("codes");
  const { courseId, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const courses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  const courseFilter = courses.some((c) => c.id === courseId) ? courseId : undefined;
  const statusFilter = status === "used" || status === "unused" ? status : undefined;

  const where = {
    ...(courseFilter ? { courseId: courseFilter } : {}),
    ...(statusFilter ? { isUsed: statusFilter === "used" } : {}),
  };
  const countScope = courseFilter ? { courseId: courseFilter } : {};

  const [total, used, codes, filteredCount] = await Promise.all([
    db.prepaidCode.count({ where: countScope }),
    db.prepaidCode.count({ where: { ...countScope, isUsed: true } }),
    db.prepaidCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        course: { select: { title: true } },
        usedBy: { select: { name: true, email: true } },
      },
    }),
    db.prepaidCode.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const exportParams = new URLSearchParams();
  if (courseFilter) exportParams.set("courseId", courseFilter);
  if (statusFilter) exportParams.set("status", statusFilter);
  const exportHref = `/api/prepaid-codes/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  const rows: PrepaidCodeRow[] = codes.map((c) => ({
    id: c.id,
    code: c.code,
    courseTitle: c.course.title,
    isUsed: c.isUsed,
    usedByName: c.usedBy?.name ?? null,
    usedByEmail: c.usedBy?.email ?? null,
    usedAt: c.usedAt ? c.usedAt.getTime() : null,
    createdAt: c.createdAt.getTime(),
  }));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">أكواد الكورسات</h1>
      <p className="mt-2 text-slate-400">
        أنشئ دفعات من الأكواد المدفوعة مسبقًا لكل كورس، وتابع المستخدَم منها وغير المستخدَم.
      </p>

      <div className="mt-8 max-w-2xl">
        <GeneratePrepaidCodesForm courses={courses} />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-md">
        {[
          { label: "الإجمالي", value: total },
          { label: "غير مستخدَم", value: total - used },
          { label: "مستخدَم", value: used },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-control border border-white/10 bg-navy-900/60 p-4 text-center shadow-card"
          >
            <p className="text-xl font-extrabold text-white">
              {s.value.toLocaleString("ar-EG")}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PrepaidCodesFilters
          courses={courses}
          courseId={courseFilter}
          status={statusFilter}
        />
        {filteredCount > 0 && (
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-control border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400"
          >
            <Download size={15} />
            تصدير CSV
          </a>
        )}
      </div>

      <div className="mt-4">
        <PrepaidCodesTable rows={rows} />
      </div>

      <Pagination
        currentPage={Math.min(page, totalPages)}
        totalPages={totalPages}
        basePath="/dashboard/admin/prepaid-codes"
        query={{ courseId: courseFilter, status: statusFilter }}
      />
    </div>
  );
}
