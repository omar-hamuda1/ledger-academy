import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { updateLessonSchema } from "@/lib/validators/lesson";
import { moveSchema } from "@/lib/validators/reorder";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  // Reorder within the module (swap `order` with the adjacent lesson).
  const move = moveSchema.safeParse(body);
  if (move.success) {
    const current = await db.lesson.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "الدرس غير موجود." }, { status: 404 });
    }
    const up = move.data.direction === "up";
    const neighbor = await db.lesson.findFirst({
      where: { moduleId: current.moduleId, order: up ? { lt: current.order } : { gt: current.order } },
      orderBy: { order: up ? "desc" : "asc" },
    });
    if (!neighbor) return NextResponse.json({ ok: true, moved: false });

    await db.$transaction([
      db.lesson.update({ where: { id: current.id }, data: { order: neighbor.order } }),
      db.lesson.update({ where: { id: neighbor.id }, data: { order: current.order } }),
    ]);

    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "lesson.reorder",
      targetType: "Lesson",
      targetId: id,
      metadata: { direction: move.data.direction },
    });

    return NextResponse.json({ ok: true, moved: true });
  }

  const parsed = updateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { title, videoUrl, contentHtml, order } = parsed.data;

  const lesson = await db.lesson.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
      ...(contentHtml !== undefined && { contentHtml: contentHtml || null }),
      ...(order !== undefined && { order }),
    },
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "lesson.update",
    targetType: "Lesson",
    targetId: id,
    metadata: { title, videoUrl, order },
  });

  return NextResponse.json({ lesson });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;

  await db.$transaction(async (tx) => {
    const quiz = await tx.quiz.findUnique({ where: { lessonId: id } });
    if (quiz) {
      await tx.quizAttempt.deleteMany({ where: { quizId: quiz.id } });
      await tx.quiz.delete({ where: { id: quiz.id } });
    }
    await tx.lessonProgress.deleteMany({ where: { lessonId: id } });
    await tx.lesson.delete({ where: { id } });
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "lesson.delete",
    targetType: "Lesson",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
