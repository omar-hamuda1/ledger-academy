import { Star } from "lucide-react";

/** Five discrete stars, filled up to a rounded `value` (0–5). Display only. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= filled ? "text-gold-400" : "text-slate-600"}
          fill={i <= filled ? "currentColor" : "none"}
          aria-hidden
        />
      ))}
    </span>
  );
}
