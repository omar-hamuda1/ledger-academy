import { db } from "@/lib/db";
import { paymentProofStore } from "@/lib/storage";
import { Pagination } from "@/components/admin/Pagination";
import {
  CodeOrdersTable,
  type CodeOrderRow,
} from "@/components/admin/CodeOrdersTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const STATUSES = [
  { key: "pending", label: "قيد المراجعة", value: "PENDING" as const },
  { key: "approved", label: "مقبول", value: "APPROVED" as const },
  { key: "rejected", label: "مرفوض", value: "REJECTED" as const },
  { key: "all", label: "الكل", value: undefined },
];

export default async function AdminCodeOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const active = STATUSES.find((s) => s.key === statusParam) ?? STATUSES[0];
  const page = Math.max(1, Number(pageParam) || 1);

  const where = active.value ? { status: active.value } : {};

  const [orders, filteredCount, pendingCount, approvedCount, rejectedCount] =
    await Promise.all([
      db.codeOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
          prepaidCode: { select: { code: true } },
        },
      }),
      db.codeOrder.count({ where }),
      db.codeOrder.count({ where: { status: "PENDING" } }),
      db.codeOrder.count({ where: { status: "APPROVED" } }),
      db.codeOrder.count({ where: { status: "REJECTED" } }),
    ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const counts: Record<string, number> = {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    all: pendingCount + approvedCount + rejectedCount,
  };

  // Short-lived presigned GET URLs so the private screenshots render in the
  // table without making the bucket public. Regenerated each page load
  // (the page is force-dynamic).
  const proofUrls = new Map<string, string>();
  const store = paymentProofStore;
  if (store) {
    await Promise.all(
      orders
        .filter((o) => o.paymentProofKey)
        .map(async (o) => {
          try {
            const url = await store.url(o.paymentProofKey!, { expiresIn: 3600 });
            proofUrls.set(o.id, url);
          } catch {
            /* leave it out — the row just shows no thumbnail */
          }
        }),
    );
  }

  const rows: CodeOrderRow[] = orders.map((o) => ({
    id: o.id,
    studentName: o.user.name,
    studentEmail: o.user.email,
    studentPhone: o.studentPhone,
    courseTitle: o.course.title,
    paymentNote: o.paymentNote,
    proofUrl: proofUrls.get(o.id) ?? null,
    status: o.status,
    rejectionReason: o.rejectionReason,
    issuedCode: o.prepaidCode?.code ?? null,
    createdAt: o.createdAt.getTime(),
    reviewedAt: o.reviewedAt ? o.reviewedAt.getTime() : null,
  }));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">طلبات أكواد الكورسات</h1>
      <p className="mt-2 text-slate-400">
        طلبات الطلاب لشراء أكواد الكورسات المدفوعة. تحقّق من وصول التحويل ثم وافق أو
        ارفض — الموافقة تفتح الكورس للطالب فورًا.
      </p>

      <div className="mt-6 flex flex-wrap gap-1">
        {STATUSES.map((s) => {
          const isActive = s.key === active.key;
          return (
            <a
              key={s.key}
              href={`/dashboard/admin/code-orders?status=${s.key}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-gold-400/10 text-gold-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {s.label}
              <span className="mr-1.5 text-xs text-slate-400">
                {(counts[s.key] ?? 0).toLocaleString("ar-EG")}
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-4">
        <CodeOrdersTable rows={rows} />
      </div>

      <Pagination
        currentPage={Math.min(page, totalPages)}
        totalPages={totalPages}
        basePath="/dashboard/admin/code-orders"
        query={{ status: active.key }}
      />
    </div>
  );
}
