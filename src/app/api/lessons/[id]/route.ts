import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { updateLessonSchema } from "@/lib/validators/lesson";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
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
