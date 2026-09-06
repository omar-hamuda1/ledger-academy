import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { createResourceSchema } from "@/lib/validators/lesson";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const resource = await db.resource.create({ data: parsed.data });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "resource.create",
    targetType: "Resource",
    targetId: resource.id,
    metadata: { label: resource.label, lessonId: resource.lessonId },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
