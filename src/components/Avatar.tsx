const SIZES = {
  sm: "h-8 w-8 text-xs font-bold",
  md: "h-12 w-12 text-sm font-bold",
  lg: "h-16 w-16 text-2xl font-extrabold",
} as const;

/**
 * A user's photo when `url` is set (a plain <img> — presigned avatar URLs
 * rotate, so not next/image), otherwise the first letter of `name` in the
 * gold initials circle. Presentational only.
 */
export function Avatar({
  name,
  url,
  size = "md",
  className = "",
}: {
  name: string;
  url?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = `shrink-0 rounded-full ${SIZES[size]} ${className}`;

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${base} object-cover`} />;
  }

  return (
    <span
      className={`${base} flex items-center justify-center bg-gold-400/10 text-gold-400`}
    >
      {name.trim().slice(0, 1).toUpperCase() || "؟"}
    </span>
  );
}
