import { db } from "@/lib/db";
import { Users } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "محاضر",
  STUDENT: "طالب",
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-gold-400/10 text-gold-400",
  STUDENT: "bg-emerald-400/10 text-emerald-400",
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">الطلاب والمستخدمون</h1>
      <p className="mt-2 text-slate-400">جميع الحسابات المسجلة على المنصة.</p>

      {users.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-card border border-white/10 bg-navy-900/60 p-16 text-center shadow-card">
          <Users size={32} className="text-slate-600" />
          <p className="text-slate-400">لا يوجد مستخدمون مسجّلون بعد.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-semibold">الاسم</th>
                <th className="px-4 py-3 font-semibold">البريد الإلكتروني</th>
                <th className="px-4 py-3 font-semibold">الدور</th>
                <th className="px-4 py-3 font-semibold">تاريخ الانضمام</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400/10 text-xs font-bold text-gold-400">
                        {initials(user.name)}
                      </span>
                      {user.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_STYLE[user.role] ?? "bg-white/5 text-slate-300"}`}
                    >
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/admin/users" />
    </div>
  );
}
