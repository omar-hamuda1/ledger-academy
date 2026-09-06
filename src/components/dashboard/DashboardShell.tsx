"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Users,
  Home,
  ClipboardList,
  Calculator,
  Banknote,
  Settings,
} from "lucide-react";
import { SignOutButton } from "./SignOutButton";

const navConfig = {
  admin: {
    roleLabel: "لوحة تحكم المحاضر",
    items: [
      { href: "/dashboard/admin", label: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/dashboard/admin/courses", label: "إدارة الكورسات والأسعار", icon: Banknote },
      { href: "/dashboard/admin/lessons", label: "إدارة الدروس", icon: BookOpen },
      { href: "/dashboard/admin/progress", label: "تقدم الطلاب", icon: TrendingUp },
      { href: "/dashboard/admin/users", label: "الطلاب والمستخدمون", icon: Users },
      { href: "/dashboard/admin/settings", label: "الإعدادات العامة", icon: Settings },
    ],
  },
  student: {
    roleLabel: "لوحة تحكم الطالب",
    items: [
      { href: "/dashboard/student", label: "الرئيسية وكورساتي", icon: Home },
      { href: "/dashboard/student/quizzes", label: "اختباراتي", icon: ClipboardList },
      { href: "/dashboard/student/tools", label: "الأدوات التفاعلية", icon: Calculator },
    ],
  },
} as const;

export function DashboardShell({
  role,
  userName,
  children,
}: {
  role: keyof typeof navConfig;
  userName?: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { roleLabel, items: navItems } = navConfig[role];

  const sidebarContent = (
    <>
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-950">
          <GraduationCap size={20} />
        </span>
        <span className="text-lg font-extrabold text-white">
          Ledger <span className="text-gold-400">Academy</span>
        </span>
      </Link>

      <p className="px-6 pb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {roleLabel}
      </p>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gold-400/10 text-gold-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen bg-navy-950 text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-white/10 bg-navy-900/60 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex w-64 flex-col border-l border-white/10 bg-navy-950">
            {sidebarContent}
          </div>
          <button
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/60"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-navy-950/80 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            aria-label="فتح القائمة"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            {userName && <span className="text-sm text-slate-300">{userName}</span>}
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
