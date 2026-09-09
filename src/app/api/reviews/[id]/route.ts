import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { moderateReviewSchema } from "@/lib/validators/reviews";
import { logAudit } from "@/lib/audit";

// Admin hides / un-hides a review (moderation). Hidden reviews drop out of the
// average and the public list.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireScope("reviews");
  if (!admin) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = moderateReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const existing = await db.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "التقييم غير موجود." }, { status: 404 });
  }

  const review = await db.review.update({
    where: { id },
    data: { hidden: parsed.data.hidden },
  });
  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: parsed.data.hidden ? "review.hide" : "review.unhide",
    targetType: "Review",
    targetId: id,
    metadata: { courseId: existing.courseId, studentId: existing.userId },
  });

  return NextResponse.json({ review });
}

// Delete a review — the author's own, or any (admin).
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
  const review = await db.review.findUnique({ where: { id } });
  if (!review) {
    return NextResponse.json({ error: "التقييم غير موجود." }, { status: 404 });
  }

  const isOwner = review.userId === userId;
  const admin = isOwner ? null : await requireScope("reviews");
  if (!isOwner && !admin) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });
  }

  await db.review.delete({ where: { id } });
  if (admin) {
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "review.delete",
      targetType: "Review",
      targetId: id,
      metadata: { courseId: review.courseId, studentId: review.userId },
    });
  }

  return NextResponse.json({ ok: true });
}
