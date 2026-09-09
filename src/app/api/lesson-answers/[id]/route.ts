import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

// Delete an answer. The author's own, or any (admin).
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
  const answer = await db.lessonAnswer.findUnique({ where: { id } });
  if (!answer) {
    return NextResponse.json({ error: "الرد غير موجود." }, { status: 404 });
  }

  const isOwner = answer.userId === userId;
  const admin = isOwner ? null : await requireScope("courses");
  if (!isOwner && !admin) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });
  }

  await db.lessonAnswer.delete({ where: { id } });
  if (admin) {
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "lesson_answer.delete",
      targetType: "LessonAnswer",
      targetId: id,
      metadata: { questionId: answer.questionId, authorId: answer.userId },
    });
  }

  return NextResponse.json({ ok: true });
}
