import { db } from "@/lib/db";

export async function getSiteSettings() {
  const settings = await db.siteSettings.findUnique({ where: { id: "main" } });
  if (settings) return settings;
  return db.siteSettings.create({ data: { id: "main" } });
}
