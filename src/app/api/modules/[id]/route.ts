import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;

  await db.$transaction(async (tx) => {
    const lessons = await tx.lesson.findMany({
      where: { moduleId: id },
      include: { quiz: true },
    });
    const lessonIds = lessons.map((l) => l.id);
    const quizIds = lessons.filter((l) => l.quiz).map((l) => l.quiz!.id);

    if (quizIds.length > 0) {
      await tx.quizAttempt.deleteMany({ where: { quizId: { in: quizIds } } });
      await tx.quiz.deleteMany({ where: { id: { in: quizIds } } });
    }
    if (lessonIds.length > 0) {
      await tx.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
    }
    await tx.module.delete({ where: { id } });
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "module.delete",
    targetType: "Module",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
