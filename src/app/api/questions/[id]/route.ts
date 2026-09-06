import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  await db.question.delete({ where: { id } });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "question.delete",
    targetType: "Question",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
