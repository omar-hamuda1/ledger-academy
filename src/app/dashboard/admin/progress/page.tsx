import { db } from "@/lib/db";
import { Pagination } from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [students, totalCount] = await Promise.all([
    db.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        enrollments: true,
        progress: true,
      },
    }),
    db.user.count({ where: { role: "STUDENT" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">تقدم الطلاب</h1>
      <p className="mt-2 text-slate-400">
        نظرة عامة على عدد الكورسات المسجل بها كل طالب وعدد الدروس المكتملة.
      </p>

      {students.length === 0 ? (
        <p className="mt-8 text-slate-500">لا يوجد طلاب مسجلون بعد.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-semibold">الطالب</th>
                <th className="px-4 py-3 font-semibold">البريد الإلكتروني</th>
                <th className="px-4 py-3 font-semibold">عدد الكورسات</th>
                <th className="px-4 py-3 font-semibold">الدروس المكتملة</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3 text-slate-400">{student.email}</td>
                  <td className="px-4 py-3">{student.enrollments.length}</td>
                  <td className="px-4 py-3">
                    {student.progress.filter((p) => p.completed).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/admin/progress" />
    </div>
  );
}
