import { db } from "@/lib/db";
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
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [broadcasts, totalCount, studentCount] = await Promise.all([
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
    db.user.count({ where: { role: "STUDENT" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">إدارة الإشعارات</h1>
      <p className="mt-2 text-slate-400">
        أرسل إشعارًا يظهر لكل الطلاب في جرس الإشعارات أعلى لوحة التحكم.
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
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  {n._count.reads.toLocaleString("ar-EG")} / {studentCount.toLocaleString("ar-EG")} قرأوه
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {n.body}
              </p>
              <p className="mt-2 text-xs text-slate-500">
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
