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
