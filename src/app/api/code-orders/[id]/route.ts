import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { reviewCodeOrderSchema } from "@/lib/validators/code-orders";
import { generateCode } from "@/lib/prepaid-codes";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewCodeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const order = await db.codeOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "تمت مراجعة هذا الطلب من قبل." },
      { status: 409 },
    );
  }

  if (parsed.data.action === "reject") {
    const updated = await db.codeOrder.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectionReason: parsed.data.rejectionReason ?? null,
      },
    });
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "code_order.reject",
      targetType: "CodeOrder",
      targetId: id,
      metadata: { courseId: order.courseId, studentId: order.userId },
    });
    return NextResponse.json({ order: updated });
  }

  // approve
  const alreadyEnrolled = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
  });

  if (alreadyEnrolled) {
    // Nothing to grant — just close the request out.
    const updated = await db.codeOrder.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    });
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "code_order.approve",
      targetType: "CodeOrder",
      targetId: id,
      metadata: { courseId: order.courseId, studentId: order.userId, note: "already enrolled" },
    });
    return NextResponse.json({ order: updated, alreadyEnrolled: true });
  }

  // Pick a code string not already taken (collision ~impossible, but bounded).
  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db.prepaidCode.findUnique({ where: { code } });
    if (!clash) break;
    code = generateCode();
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const issued = await tx.prepaidCode.create({
        data: {
          code,
          courseId: order.courseId,
          isUsed: true,
          usedById: order.userId,
          usedAt: new Date(),
        },
      });
      await tx.enrollment.create({
        data: { userId: order.userId, courseId: order.courseId },
      });
      return tx.codeOrder.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: admin.id,
          reviewedAt: new Date(),
          prepaidCodeId: issued.id,
        },
        include: { prepaidCode: { select: { code: true } } },
      });
    });

    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "code_order.approve",
      targetType: "CodeOrder",
      targetId: id,
      metadata: { courseId: order.courseId, studentId: order.userId },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Student got enrolled between the check above and now — close the
      // request without issuing a code.
      const updated = await db.codeOrder.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      });
      return NextResponse.json({ order: updated, alreadyEnrolled: true });
    }
    console.error("code order approval failed:", error);
    return NextResponse.json(
      { error: "تعذّرت الموافقة على الطلب، حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
