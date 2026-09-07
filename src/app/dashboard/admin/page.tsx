import Link from "next/link";
import { BookOpen, TrendingUp, Users, Banknote, Ticket } from "lucide-react";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { QuickActions } from "@/components/admin/QuickActions";

export const dynamic = "force-dynamic";

const cards = [
  {
    href: "/dashboard/admin/courses",
    icon: Banknote,
    title: "إدارة الكورسات والأسعار",
    description: "تحكم في سعر كل كورس بالجنيه المصري وحالة نشره.",
  },
  {
    href: "/dashboard/admin/lessons",
    icon: BookOpen,
    title: "إدارة الدروس",
    description: "أضف دروسًا جديدة وارفع الفيديوهات والملفات الخاصة بكل وحدة.",
  },
  {
    href: "/dashboard/admin/progress",
    icon: TrendingUp,
    title: "تقدم الطلاب",
    description: "تابع نسب إكمال الدروس ونتائج الاختبارات لكل طالب.",
  },
  {
    href: "/dashboard/admin/users",
    icon: Users,
    title: "الطلاب والمستخدمون",
    description: "استعرض جميع الحسابات المسجلة على المنصة وأدوارها.",
  },
  {
    href: "/dashboard/admin/prepaid-codes",
    icon: Ticket,
    title: "أكواد الكورسات",
    description: "أنشئ أكواد تفعيل مدفوعة مسبقًا وتابع المستخدَم منها.",
  },
];

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

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
