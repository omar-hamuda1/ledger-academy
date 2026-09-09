import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireScope("courses");
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  await db.resource.delete({ where: { id } });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "resource.delete",
    targetType: "Resource",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
