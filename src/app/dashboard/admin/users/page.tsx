import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Pagination } from "@/components/admin/Pagination";
import { UserRowActions } from "@/components/admin/UserRowActions";

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

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const [users, totalCount, viewer] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count(),
    currentUserId
      ? db.user.findUnique({ where: { id: currentUserId }, select: { superAdmin: true } })
      : null,
  ]);
  const viewerIsSuperAdmin = viewer?.superAdmin ?? false;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">الطلاب والمستخدمون</h1>
      <p className="mt-2 text-slate-400">
        جميع الحسابات المسجلة على المنصة. يمكنك ترقية مستخدم إلى محاضر أو خفضه، وتعطيل حساب أو إعادة تفعيله.
      </p>

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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400/10 text-xs font-bold text-gold-400">
                          {initials(user.name)}
                        </span>
                        <span className="flex items-center gap-2">
                          {user.name}
                          {isSelf && <span className="text-[11px] text-slate-400">(أنت)</span>}
                          {user.superAdmin && (
                            <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                              مسؤول رئيسي
                            </span>
                          )}
                          {user.disabledAt && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              معطّل
                            </span>
                          )}
                        </span>
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
                    <td className="px-4 py-3 text-slate-400">{dateFmt.format(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="block text-left text-[11px] text-slate-400">—</span>
                      ) : user.superAdmin && !viewerIsSuperAdmin ? (
                        <span className="block text-left text-[11px] text-slate-400">
                          حساب محمي — لا يمكن تعديله
                        </span>
                      ) : (
                        <UserRowActions
                          userId={user.id}
                          userName={user.name}
                          role={user.role as "ADMIN" | "STUDENT"}
                          disabled={user.disabledAt !== null}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/admin/users" />
    </div>
  );
}
