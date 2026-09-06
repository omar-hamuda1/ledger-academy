import Link from "next/link";
import { BookOpen, TrendingUp, Users, Banknote } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [studentCount, courseCount] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.course.count(),
  ]);

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
  ];

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">لوحة تحكم المحاضر</h1>
      <p className="mt-2 text-slate-400">
        إدارة كورس إدارة الأعمال، ومتابعة الدروس وتقدم الطلاب من مكان واحد.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
          <p className="text-sm text-slate-400">إجمالي الطلاب</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{studentCount}</p>
        </div>
        <div className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
          <p className="text-sm text-slate-400">عدد الكورسات</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{courseCount}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
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
