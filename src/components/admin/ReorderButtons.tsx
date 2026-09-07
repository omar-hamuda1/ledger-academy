"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * Move-up / move-down controls for a module or lesson row in the admin lesson
 * manager. Posts `{ action: "move", direction }` to the item's PATCH route,
 * which swaps `order` with the adjacent sibling, then refreshes.
 */
export function ReorderButtons({
  kind,
  id,
  isFirst,
  isLast,
}: {
  kind: "modules" | "lessons";
  id: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function move(direction: "up" | "down") {
    setLoading(true);
    try {
      const res = await fetch(`/api/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", direction }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const btn =
    "flex h-7 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-white/10 hover:text-gold-400 disabled:pointer-events-none disabled:opacity-25";

  return (
    <span className="flex flex-col">
      <button
        type="button"
        onClick={() => move("up")}
        disabled={loading || isFirst}
        aria-label="تحريك لأعلى"
        className={btn}
      >
        <ChevronUp size={14} />
      </button>
      <button
        type="button"
        onClick={() => move("down")}
        disabled={loading || isLast}
        aria-label="تحريك لأسفل"
        className={btn}
      >
        <ChevronDown size={14} />
      </button>
    </span>
  );
}
