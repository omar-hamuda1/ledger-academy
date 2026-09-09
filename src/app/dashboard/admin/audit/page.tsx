import type { Prisma } from "@prisma/client";
import { requireScopePage } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { Pagination } from "@/components/admin/Pagination";
import { AuditFilters, AUDIT_CATEGORY_LABELS } from "@/components/admin/AuditFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, string> = {
  "course.create": "إنشاء كورس",
  "course.update": "تعديل كورس",
  "lesson.create": "إنشاء درس",
  "lesson.update": "تعديل درس",
  "lesson.delete": "حذف درس",
  "lesson.reorder": "إعادة ترتيب الدروس",
  "module.create": "إنشاء وحدة",
  "module.delete": "حذف وحدة",
  "module.reorder": "إعادة ترتيب الوحدات",
  "question.create": "إضافة سؤال",
  "question.delete": "حذف سؤال",
  "quiz.create": "إنشاء اختبار",
  "quiz.update": "تعديل اختبار",
  "quiz.delete": "حذف اختبار",
  "quiz.bulk_import": "رفع أسئلة بالجملة",
  "resource.create": "إضافة مرفق",
  "resource.delete": "حذف مرفق",
  "settings.update": "تحديث الإعدادات العامة",
  "user.role_change": "تغيير دور مستخدم",
  "user.password_reset": "إعادة تعيين كلمة مرور",
  "user.permissions_change": "تعديل صلاحيات محاضر",
  "user.delete": "حذف مستخدم نهائيًا",
  "notification.broadcast": "إرسال إشعار عام",
  "code_order.approve": "قبول طلب كود",
  "code_order.reject": "رفض طلب كود",
  "prepaid_codes.generate": "توليد أكواد",
  "prepaid_codes.export": "تصدير أكواد",
  "prepaid_codes.delete": "حذف أكواد",
  "review.delete": "حذف تقييم",
  "review.hide": "إخفاء تقييم",
  "review.unhide": "إظهار تقييم",
  "lesson_question.delete": "حذف سؤال درس",
  "lesson_answer.delete": "حذف إجابة درس",
  "enrollment.remove": "إلغاء اشتراك",
};

// category key (from AuditFilters) → the `action` prefixes it covers
const AUDIT_CATEGORIES: Record<string, string[]> = {
  course: ["course."],
  lesson: ["lesson."],
  module: ["module."],
  quiz: ["quiz.", "question."],
  resource: ["resource."],
  user: ["user."],
  notification: ["notification."],
  codes: ["code_order.", "prepaid_codes."],
  review: ["review."],
  qa: ["lesson_question.", "lesson_answer."],
  enrollment: ["enrollment."],
  settings: ["settings."],
};

function formatMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—";
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
}

/** "2026-09-09" → Date, or undefined if not a valid ISO date string. */
function parseDay(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; cat?: string; from?: string; to?: string }>;
}) {
  await requireScopePage("audit");
  const { page: pageParam, q, cat, from, to } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const search = (q ?? "").trim();
  const catFilter = cat && cat in AUDIT_CATEGORIES ? cat : undefined;
  const fromDate = parseDay(from);
  const toDate = parseDay(to, true);

  const and: Prisma.AuditLogWhereInput[] = [];
  if (search) {
    and.push({
      OR: [
        { actorEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { targetId: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (catFilter) {
    and.push({ OR: AUDIT_CATEGORIES[catFilter].map((prefix) => ({ action: { startsWith: prefix } })) });
  }
  if (fromDate || toDate) {
    and.push({ createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } });
  }
  const where: Prisma.AuditLogWhereInput = and.length ? { AND: and } : {};
  const hasFilters = Boolean(search || catFilter || fromDate || toDate);

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">سجل النشاط</h1>
      <p className="mt-2 text-slate-400">
        سجل بكل إجراءات الإدارة (إنشاء، تعديل، حذف) مع تحديد من قام بها ومتى.
      </p>

      <AuditFilters
        q={search || undefined}
        cat={catFilter}
        from={fromDate ? from : undefined}
        to={toDate ? to : undefined}
      />

      <p className="mt-3 text-xs text-slate-400">
        {totalCount.toLocaleString("ar-EG")} {hasFilters ? "نتيجة مطابقة" : "إجراء مسجَّل"}
        {catFilter && ` · ${AUDIT_CATEGORY_LABELS[catFilter]}`}
      </p>

      {logs.length === 0 ? (
        <div className="mt-4 rounded-card border border-white/10 bg-navy-900/60 p-16 text-center shadow-card">
          <p className="text-slate-400">
            {hasFilters ? "لا توجد إجراءات مطابقة لبحثك." : "لا يوجد أي نشاط مسجَّل بعد."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/dashboard/admin/audit"
        query={{ q: search || undefined, cat: catFilter, from: fromDate ? from : undefined, to: toDate ? to : undefined }}
      />
    </div>
  );
}
