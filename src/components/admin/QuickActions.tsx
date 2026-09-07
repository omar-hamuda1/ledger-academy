"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  ChevronDown,
  PlusCircle,
  BookOpen,
  Settings,
  History,
} from "lucide-react";

const ACTIONS = [
  { href: "/dashboard/admin/courses/new", label: "إنشاء كورس جديد", icon: PlusCircle },
  { href: "/dashboard/admin/lessons", label: "إضافة درس أو وحدة", icon: BookOpen },
  { href: "/dashboard/admin/settings", label: "الإعدادات العامة", icon: Settings },
  { href: "/dashboard/admin/audit", label: "سجل النشاط", icon: History },
] as const;

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
      >
        <Zap size={16} />
        إجراءات سريعة
        <ChevronDown
          size={15}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-20 mt-2 w-60 overflow-hidden rounded-card border border-white/10 bg-navy-900 p-1.5 shadow-elevated"
          >
            {ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-control px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
              >
                <action.icon size={16} className="text-gold-400" />
                {action.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
