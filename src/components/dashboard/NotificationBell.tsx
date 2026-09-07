"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, BellOff } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Item = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  read: boolean;
};

const POLL_MS = 60_000;
const rel = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return rel.format(-min, "minute");
  const hr = Math.round(min / 60);
  if (hr < 24) return rel.format(-hr, "hour");
  return rel.format(-Math.round(hr / 24), "day");
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* transient — keep last state */
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
    const t = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  async function mark(payload: { id: string } | { all: true }) {
    // Optimistic
    setItems((prev) =>
      prev.map((n) =>
        "all" in payload || n.id === payload.id ? { ...n, read: true } : n,
      ),
    );
    setUnread((u) => ("all" in payload ? 0 : Math.max(0, u - 1)));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      /* poll will re-sync */
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="الإشعارات"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-navy-950">
              {unread > 9 ? "9+" : unread.toLocaleString("ar-EG")}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        dir="rtl"
        className="w-80 max-w-[calc(100vw-2rem)] gap-0 border-white/10 bg-navy-900 p-0 text-slate-100 ring-white/10"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="text-sm font-bold text-white">الإشعارات</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => mark({ all: true })}
              className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-gold-400"
            >
              <Check size={12} />
              تعليم الكل كمقروء
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-slate-400">
              <BellOff size={22} className="text-slate-600" />
              لا توجد إشعارات بعد.
            </div>
          ) : (
            items.map((n) => {
              const inner = (
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-gold-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{n.body}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
              const cls = `block border-b border-white/5 px-4 py-3 text-right transition last:border-0 hover:bg-white/[0.03] ${
                n.read ? "" : "bg-gold-400/[0.04]"
              }`;
              return n.href ? (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    if (!n.read) mark({ id: n.id });
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
                  onClick={() => !n.read && mark({ id: n.id })}
                  className={`w-full ${cls}`}
                >
                  {inner}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
