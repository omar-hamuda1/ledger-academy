import { db } from "@/lib/db";
import { requireScopePage } from "@/lib/require-admin";
import { BellRing } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { ComposeNotificationForm } from "@/components/admin/ComposeNotificationForm";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireScopePage("notifications");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [broadcasts, totalCount, studentJoinDates] = await Promise.all([
    db.notification.findMany({
      where: { targetUserId: null },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { reads: true } },
      },
    }),
    db.notification.count({ where: { targetUserId: null } }),
    db.user.findMany({ where: { role: "STUDENT" }, select: { createdAt: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const studentCount = studentJoinDates.length;
  // For a CURRENT_STUDENTS broadcast the real denominator is students who had
  // already registered when it went out, not everyone now.
  const audienceSize = (n: { audience: string; createdAt: Date }) =>
    n.audience === "ALL_STUDENTS"
      ? studentCount
      : studentJoinDates.filter((s) => s.createdAt <= n.createdAt).length;

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">إدارة الإشعارات</h1>
      <p className="mt-2 text-slate-400">
        أرسل إشعارًا يظهر للطلاب في جرس الإشعارات أعلى لوحة التحكم. اختر إن كان
        للطلاب الحاليين فقط أو لكل من ينضم لاحقًا أيضًا.
      </p>

      <div className="mt-8 max-w-2xl">
        <ComposeNotificationForm />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-bold text-white">الإشعارات المُرسَلة</h2>
      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-white/10 bg-navy-900/60 p-16 text-center shadow-card">
          <BellRing size={32} className="text-slate-600" />
          <p className="text-slate-400">لم تُرسل أي إشعارات بعد.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {broadcasts.map((n) => (
            <li
              key={n.id}
              className="rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold text-white">{n.title}</p>
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      n.audience === "ALL_STUDENTS"
                        ? "bg-gold-400/10 text-gold-300"
                        : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {n.audience === "ALL_STUDENTS" ? "كل الطلاب" : "الحاليون وقت الإرسال"}
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    {n._count.reads.toLocaleString("ar-EG")} / {audienceSize(n).toLocaleString("ar-EG")} قرأوه
                  </span>
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {n.body}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {dateFmt.format(n.createdAt)}
                {n.createdBy?.name ? ` · ${n.createdBy.name}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        currentPage={Math.min(page, totalPages)}
        totalPages={totalPages}
        basePath="/dashboard/admin/notifications"
      />
    </div>
  );
}
