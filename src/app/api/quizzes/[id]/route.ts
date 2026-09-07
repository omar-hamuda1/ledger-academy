import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const quiz = await db.quiz.findUnique({ where: { id } });
  if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود." }, { status: 404 });

  // QuizAttempt → Quiz has no cascade (ON DELETE RESTRICT), so clear attempts
  // first; Question → Quiz is Cascade. One transaction so we never orphan.
  await db.$transaction([
    db.quizAttempt.deleteMany({ where: { quizId: id } }),
    db.quiz.delete({ where: { id } }),
  ]);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "quiz.delete",
    targetType: "Quiz",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
