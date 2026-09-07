"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, X } from "lucide-react";

const STORAGE_KEY = "la_announcement_dismissed";

/**
 * Small stable hash of the announcement text. The per-viewer "dismissed"
 * flag is keyed to this, so editing the announcement in admin settings makes
 * the banner reappear for everyone, while an unchanged message stays hidden
 * once dismissed. No server-side timestamp needed.
 */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function AnnouncementBanner({ text }: { text: string }) {
  const key = hash(text);
  // Start hidden so SSR and the first client paint agree; reveal in effect
  // once we've checked localStorage.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== key);
    } catch {
      setVisible(true);
    }
  }, [key]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* ignore private-mode / disabled storage */
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mb-6 flex items-start gap-3 rounded-card border border-gold-400/30 bg-gold-400/10 p-4 shadow-card"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gold-400/15 text-gold-400">
            <Megaphone size={18} />
          </span>
          <p className="flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-100">
            {text}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="إخفاء الإعلان"
            className="shrink-0 rounded-control p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
