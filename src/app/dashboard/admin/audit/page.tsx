import { db } from "@/lib/db";
import { Pagination } from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, string> = {
  "course.create": "إنشاء كورس",
  "course.update": "تعديل كورس",
  "lesson.create": "إنشاء درس",
  "lesson.update": "تعديل درس",
  "lesson.delete": "حذف درس",
  "module.create": "إنشاء وحدة",
  "module.delete": "حذف وحدة",
  "question.create": "إضافة سؤال",
  "question.delete": "حذف سؤال",
  "quiz.create": "إنشاء اختبار",
  "quiz.delete": "حذف اختبار",
  "resource.create": "إضافة مرفق",
  "resource.delete": "حذف مرفق",
  "settings.update": "تحديث الإعدادات العامة",
};

function formatMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—";
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">سجل النشاط</h1>
      <p className="mt-2 text-slate-400">
        سجل بكل إجراءات الإدارة (إنشاء، تعديل، حذف) مع تحديد من قام بها ومتى.
      </p>

      {logs.length === 0 ? (
        <p className="mt-8 text-slate-400">لا يوجد أي نشاط مسجَّل بعد.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-semibold">التاريخ والوقت</th>
                <th className="px-4 py-3 font-semibold">المسؤول</th>
                <th className="px-4 py-3 font-semibold">الإجراء</th>
                <th className="px-4 py-3 font-semibold">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400" dir="ltr">
                    {new Date(log.createdAt).toLocaleString("ar-EG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">{log.actorEmail}</td>
                  <td className="px-4 py-3 font-medium text-gold-400">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-400" title={formatMetadata(log.metadata)}>
                    {formatMetadata(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/admin/audit" />
    </div>
  );
}
