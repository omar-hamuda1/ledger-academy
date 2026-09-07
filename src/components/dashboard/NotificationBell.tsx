"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const POLL_MS = 60_000;
const rel = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

function timeAgo(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return rel.format(-diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return rel.format(-diffHr, "hour");
  return rel.format(-Math.round(diffHr / 24), "day");
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* offline / transient — keep last state */
    }
  }, []);

  useEffect(() => {
    // Deferred so the first fetch isn't a synchronous setState in the effect
    // body; from here on it's a polling "subscription" to server state.
    queueMicrotask(load);
    const t = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  async function markRead(body: object) {
    // Optimistic — reconcile on the next poll.
    if ("all" in body) {
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnread(0);
    }
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      /* ignore — poll will re-sync */
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-navy-950">
            {unread > 9 ? "9+" : unread.toLocaleString("ar-EG")}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-white/10 bg-navy-900 shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-sm font-bold text-white">الإشعارات</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markRead({ all: true })}
                  className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-gold-400"
                >
                  <Check size={12} />
                  تعليم الكل كمقروء
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  لا توجد إشعارات.
                </p>
              ) : (
                items.map((n) => {
                  const inner = (
                    <>
                      <div className="flex items-start gap-2">
                        {!n.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />
                        )}
                        <div className={n.readAt ? "pr-4" : ""}>
                          <p className="text-sm font-semibold text-white">{n.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{n.body}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </>
                  );
                  const cls = `block border-b border-white/5 px-4 py-3 text-right transition last:border-0 hover:bg-white/[0.03] ${
                    n.readAt ? "" : "bg-gold-400/[0.04]"
                  }`;
                  return n.href ? (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => {
                        markRead({ id: n.id });
                        setOpen(false);
                      }}
                      className={cls}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead({ id: n.id })}
                      className={`w-full ${cls}`}
                    >
                      {inner}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
