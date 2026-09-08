import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const bodySchema = z.object({ userId: z.string().min(1) });

// Admin removes a student from a course (mistaken enrollment, refund). Hard
// delete — no row means no access, so nothing else needs to check a status.
// The student's progress + quiz attempts for THIS course go too, so a later
// re-enrolment starts clean rather than resurfacing stale progress.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });
  }

  const { id: courseId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const { userId } = parsed.data;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "الطالب غير مسجّل في هذا الكورس." }, { status: 404 });
  }

  const lessonIds = (
    await db.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    })
  ).map((l) => l.id);
  const quizIds = (
    await db.quiz.findMany({
      where: { lesson: { module: { courseId } } },
      select: { id: true },
    })
  ).map((q) => q.id);

  const [progress, attempts] = await db.$transaction([
    db.lessonProgress.deleteMany({ where: { userId, lessonId: { in: lessonIds } } }),
    db.quizAttempt.deleteMany({ where: { userId, quizId: { in: quizIds } } }),
    db.enrollment.delete({ where: { userId_courseId: { userId, courseId } } }),
  ]);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "enrollment.remove",
    targetType: "Enrollment",
    targetId: enrollment.id,
    metadata: {
      courseId,
      studentId: userId,
      lessonsWiped: progress.count,
      attemptsWiped: attempts.count,
    },
  });

  return NextResponse.json({ ok: true, lessonsWiped: progress.count, attemptsWiped: attempts.count });
}
