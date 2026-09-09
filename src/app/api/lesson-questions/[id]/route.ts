import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

// Delete a question (its answers cascade). The asker's own, or any (admin).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { id } = await params;
  const question = await db.lessonQuestion.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "السؤال غير موجود." }, { status: 404 });
  }

  const isOwner = question.userId === userId;
  const admin = isOwner ? null : await requireScope("courses");
  if (!isOwner && !admin) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });
  }

  await db.lessonQuestion.delete({ where: { id } });
  if (admin) {
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "lesson_question.delete",
      targetType: "LessonQuestion",
      targetId: id,
      metadata: { lessonId: question.lessonId, studentId: question.userId },
    });
  }

  return NextResponse.json({ ok: true });
}
