"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Wrench, X, FileText, PanelLeftOpen } from "lucide-react";
import type { Resource } from "@prisma/client";
import { BreakEvenCalculator } from "@/components/tools/BreakEvenCalculator";
import { SwotBoard } from "@/components/tools/SwotBoard";
import { useLocalStorage } from "@/lib/use-local-storage";

type Tab = "files" | "tools";

const TAB_STORAGE_KEY = "la_lesson_panel_tab";
const identity = (s: string) => s;

export function LessonWorkspacePanel({
  resources,
  showBreakEven,
  showSwot,
}: {
  resources: Resource[];
  showBreakEven: boolean;
  showSwot: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const hasTools = showBreakEven || showSwot;
  const hasFiles = resources.length > 0;

  const [open, setOpen] = useState(false);
  const defaultTab: Tab = hasFiles ? "files" : "tools";
  const parseTab = useCallback(
    (raw: string): Tab => (raw === "files" || raw === "tools" ? raw : defaultTab),
    [defaultTab],
  );
  const [tab, setTab] = useLocalStorage<Tab>(
    TAB_STORAGE_KEY,
    defaultTab,
    parseTab,
    identity,
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Nothing to show — don't render the trigger at all.
  if (!hasTools && !hasFiles) return null;

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { x: "-100%" },
        animate: { x: 0 },
        exit: { x: "-100%" },
      };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-full bg-gold-400 px-4 py-3 text-sm font-bold text-navy-950 shadow-elevated transition hover:bg-gold-300"
      >
        <Wrench size={16} />
        الأدوات والملفات
        {hasFiles && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-navy-950/20 px-1 text-xs">
            {resources.length.toLocaleString("ar-EG")}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/60"
            />
            <motion.div
              {...slide}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              role="dialog"
              aria-label="أدوات وملفات الدرس"
              className="fixed inset-y-0 left-0 z-40 flex w-full max-w-md flex-col border-r border-white/10 bg-navy-900 shadow-elevated"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 font-bold text-white">
                  <PanelLeftOpen size={18} className="text-gold-400" />
                  أدوات وملفات الدرس
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق"
                  className="rounded-control p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {hasFiles && hasTools && (
                <div className="flex gap-1 border-b border-white/10 px-3 pt-2">
                  <TabButton active={tab === "files"} onClick={() => setTab("files")}>
                    الملفات ({resources.length.toLocaleString("ar-EG")})
                  </TabButton>
                  <TabButton active={tab === "tools"} onClick={() => setTab("tools")}>
                    الأدوات
                  </TabButton>
                </div>
              )}

              <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">
                {(tab === "files" || !hasTools) && hasFiles && (
                  <ul className="space-y-2">
                    {resources.map((resource) => (
                      <li key={resource.id}>
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-control border border-white/10 bg-navy-950/40 px-3 py-3 text-sm text-slate-200 transition hover:border-gold-400/30 hover:text-white"
                        >
                          <FileText size={16} className="shrink-0 text-gold-400" />
                          <span className="flex-1">{resource.label}</span>
                          <span className="text-xs text-slate-400">{resource.fileType}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {(tab === "tools" || !hasFiles) && hasTools && (
                  <div className="space-y-6">
                    {showBreakEven && <BreakEvenCalculator />}
                    {showSwot && <SwotBoard />}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-control px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-b-2 border-gold-400 text-gold-400"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
