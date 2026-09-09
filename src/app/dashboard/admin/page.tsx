import Link from "next/link";
import { BookOpen, TrendingUp, Users, Banknote, Ticket, Inbox, BellRing, Lock } from "lucide-react";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { requireAdmin } from "@/lib/require-admin";
import { adminHasScope, SCOPE_LABELS, isAdminScope, type AdminScope } from "@/lib/authz";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { QuickActions } from "@/components/admin/QuickActions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [metrics, me, { denied }] = await Promise.all([
    getAdminMetrics(),
    requireAdmin(),
    searchParams,
  ]);
  const actor = {
    superAdmin: me?.superAdmin ?? false,
    restrictedScopes: me?.restrictedScopes ?? [],
  };
  const deniedScope: AdminScope | null =
    denied && isAdminScope(denied) && !adminHasScope(actor, denied) ? denied : null;

  const allCards: {
    href: string;
    icon: typeof Banknote;
    title: string;
    description: string;
    scope: AdminScope;
  }[] = [
    {
      href: "/dashboard/admin/courses",
      icon: Banknote,
      title: "إدارة الكورسات والأسعار",
      description: "تحكم في سعر كل كورس بالجنيه المصري وحالة نشره.",
      scope: "courses",
    },
    {
      href: "/dashboard/admin/lessons",
      icon: BookOpen,
      title: "إدارة الدروس",
      description: "أضف دروسًا جديدة وارفع الفيديوهات والملفات الخاصة بكل وحدة.",
      scope: "courses",
    },
    {
      href: "/dashboard/admin/progress",
      icon: TrendingUp,
      title: "تقدم الطلاب",
      description: "تابع نسب إكمال الدروس ونتائج الاختبارات لكل طالب.",
      scope: "progress",
    },
    {
      href: "/dashboard/admin/users",
      icon: Users,
      title: "الطلاب والمستخدمون",
      description: "استعرض جميع الحسابات المسجلة على المنصة وأدوارها.",
      scope: "users",
    },
    {
      href: "/dashboard/admin/prepaid-codes",
      icon: Ticket,
      title: "أكواد الكورسات",
      description: "أنشئ أكواد تفعيل مدفوعة مسبقًا وتابع المستخدَم منها.",
      scope: "codes",
    },
    {
      href: "/dashboard/admin/code-orders",
      icon: Inbox,
      title: "طلبات الأكواد",
      description:
        metrics.pendingCodeOrders > 0
          ? `${metrics.pendingCodeOrders.toLocaleString("ar-EG")} طلب بانتظار المراجعة.`
          : "راجع طلبات الطلاب لشراء أكواد الكورسات المدفوعة.",
      scope: "codes",
    },
    {
      href: "/dashboard/admin/notifications",
      icon: BellRing,
      title: "إدارة الإشعارات",
      description: "أرسل إشعارًا يظهر لكل الطلاب في جرس الإشعارات.",
      scope: "notifications",
    },
  ];

  const cards = allCards.filter((c) => adminHasScope(actor, c.scope));

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">لوحة تحكم المحاضر</h1>
          <p className="mt-2 text-slate-400">
            نظرة عامة على نشاط المنصة، وتقدم الطلاب، وإدارة المحتوى من مكان واحد.
          </p>
        </div>
        <QuickActions />
      </div>

      {deniedScope && (
        <div className="mt-6 flex items-center gap-3 rounded-card border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <Lock size={16} className="shrink-0" />
          <span>
            ليس لديك صلاحية الوصول إلى قسم «{SCOPE_LABELS[deniedScope]}». تواصل مع
            المسؤول الرئيسي إذا كنت تحتاج إليه.
          </span>
        </div>
      )}

      <AdminStatCards metrics={metrics} />

      <AdminCharts
        weeklyActivity={metrics.weeklyActivity}
        coursePopularity={metrics.coursePopularity}
      />

      <h2 className="mt-10 mb-4 text-lg font-bold text-white">إدارة المنصة</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-elevated"
          >
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
              <card.icon size={22} />
            </span>
            <h2 className="mb-2 font-bold text-white">{card.title}</h2>
            <p className="text-sm text-slate-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
