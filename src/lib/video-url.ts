const FILE_EXTENSIONS = [".mp4", ".webm", ".ogg", ".m4v", ".mov"];

export type VideoKind = "file" | "youtube" | "other";

/** How to play a lesson's `videoUrl` — a direct file, a YouTube video, or
 *  some other embeddable page we render in an <iframe> without progress
 *  tracking. */
export function videoKind(url: string): VideoKind {
  const path = url.toLowerCase().split("?")[0];
  if (FILE_EXTENSIONS.some((ext) => path.endsWith(ext))) return "file";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
      return "youtube";
    }
  } catch {
    /* not a URL */
  }
  return "other";
}

/** The 11-char YouTube video id from a watch / share / embed / shorts link. */
export function youTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const parts = parsed.pathname.split("/");
      if (parts[1] === "embed" || parts[1] === "shorts") return parts[2] || null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * YouTube's normal watch/share links refuse to load inside an <iframe> —
 * only the /embed/<id> form does. Admins naturally paste watch/share links,
 * so this converts them transparently at render time.
 */
export function toEmbeddableUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (host === "youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
    }

    return url;
  } catch {
    return url;
  }
}
