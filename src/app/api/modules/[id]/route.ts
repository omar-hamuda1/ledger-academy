import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { moveSchema } from "@/lib/validators/reorder";
import { logAudit } from "@/lib/audit";

// Reorder a module within its course by swapping `order` with the adjacent
// sibling. A no-op (moved: false) when it's already at the top/bottom.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireScope("courses");
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const parsed = moveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const current = await db.module.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "الوحدة غير موجودة." }, { status: 404 });
  }

  const up = parsed.data.direction === "up";
  const neighbor = await db.module.findFirst({
    where: { courseId: current.courseId, order: up ? { lt: current.order } : { gt: current.order } },
    orderBy: { order: up ? "desc" : "asc" },
  });
  if (!neighbor) return NextResponse.json({ ok: true, moved: false });

  await db.$transaction([
    db.module.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    db.module.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "module.reorder",
    targetType: "Module",
    targetId: id,
    metadata: { direction: parsed.data.direction },
  });

  return NextResponse.json({ ok: true, moved: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireScope("courses");
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
