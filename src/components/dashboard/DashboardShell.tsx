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
  History,
  Ticket,
  Inbox,
  BellRing,
} from "lucide-react";
import { SignOutButton } from "./SignOutButton";
import { NotificationBell } from "./NotificationBell";
import { useT } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { MessageKey } from "@/i18n/translate";

const navConfig = {
  admin: {
    roleLabelKey: "shell.adminRole" as MessageKey,
    items: [
      { href: "/dashboard/admin", key: "shell.nav.adminHome" as MessageKey, icon: LayoutDashboard },
      { href: "/dashboard/admin/courses", key: "shell.nav.courses" as MessageKey, icon: Banknote },
      { href: "/dashboard/admin/lessons", key: "shell.nav.lessons" as MessageKey, icon: BookOpen },
      { href: "/dashboard/admin/progress", key: "shell.nav.progress" as MessageKey, icon: TrendingUp },
      { href: "/dashboard/admin/users", key: "shell.nav.users" as MessageKey, icon: Users },
      { href: "/dashboard/admin/prepaid-codes", key: "shell.nav.prepaidCodes" as MessageKey, icon: Ticket },
      { href: "/dashboard/admin/code-orders", key: "shell.nav.codeOrders" as MessageKey, icon: Inbox },
      { href: "/dashboard/admin/notifications", key: "shell.nav.notifications" as MessageKey, icon: BellRing },
      { href: "/dashboard/admin/settings", key: "shell.nav.settings" as MessageKey, icon: Settings },
      { href: "/dashboard/admin/audit", key: "shell.nav.audit" as MessageKey, icon: History },
    ],
  },
  student: {
    roleLabelKey: "shell.studentRole" as MessageKey,
    items: [
      { href: "/dashboard/student", key: "shell.nav.studentHome" as MessageKey, icon: Home },
      { href: "/dashboard/student/quizzes", key: "shell.nav.quizzes" as MessageKey, icon: ClipboardList },
      { href: "/dashboard/student/tools", key: "shell.nav.tools" as MessageKey, icon: Calculator },
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
  const t = useT();
  const { roleLabelKey, items: navItems } = navConfig[role];

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

      <p className="px-6 pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {t(roleLabelKey)}
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
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
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
            aria-label={t("header.closeMenu")}
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/60"
          />
        </div>
      )}

      {/* min-w-0 so a wide child (tables with overflow-x-auto) scrolls inside
          itself instead of pushing the whole page wide on mobile. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-navy-950/80 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            aria-label={t("header.openMenu")}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            {userName && <span className="hidden text-sm text-slate-300 sm:inline">{userName}</span>}
            <LanguageSwitcher />
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
