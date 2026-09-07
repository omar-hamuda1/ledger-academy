import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

// Delete a single prepaid code. Unused codes only — a used code is tied to an
// enrollment (and possibly an approved CodeOrder), so removing it would orphan
// that grant.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;

  const code = await db.prepaidCode.findUnique({ where: { id } });
  if (!code) {
    return NextResponse.json({ error: "الكود غير موجود." }, { status: 404 });
  }
  if (code.isUsed) {
    return NextResponse.json(
      { error: "لا يمكن حذف كود مستخدَم." },
      { status: 409 },
    );
  }

  await db.prepaidCode.delete({ where: { id } });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "prepaid_codes.delete",
    targetType: "PrepaidCode",
    targetId: id,
    metadata: { code: code.code, courseId: code.courseId },
  });

  return NextResponse.json({ ok: true });
}
