import type { SiteSettings } from "@prisma/client";
import { db } from "@/lib/db";

// The SiteSettings singleton is read on nearly every page (marketing + every
// dynamic dashboard/lesson render) but only changes when an admin saves the
// settings form. A short per-instance TTL cache keeps those renders off the
// DB. Not shared across serverless instances — each warm instance caches
// independently — and PATCH /api/settings calls bustSiteSettingsCache(), so a
// save propagates within TTL_MS at worst.
const TTL_MS = 60_000;
let cache: { at: number; value: SiteSettings } | null = null;

export function bustSiteSettingsCache() {
  cache = null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const value =
    (await db.siteSettings.findUnique({ where: { id: "main" } })) ??
    (await db.siteSettings.create({ data: { id: "main" } }));
  cache = { at: Date.now(), value };
  return value;
}
