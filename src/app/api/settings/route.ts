import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { updateSiteSettingsSchema } from "@/lib/validators/settings";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = updateSiteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const settings = await db.siteSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...parsed.data },
    update: parsed.data,
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "settings.update",
    targetType: "SiteSettings",
    targetId: "main",
    metadata: parsed.data,
  });

  return NextResponse.json({ settings });
}
