import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { redeemPrepaidCodeSchema } from "@/lib/validators/prepaid-codes";
import { normalizeCode } from "@/lib/prepaid-codes";

const TEN_MIN = 10 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const [byUser, byIp] = await Promise.all([
    checkRateLimit(`redeem:user:${userId}`, 10, TEN_MIN),
    checkRateLimit(`redeem:ip:${ip}`, 30, TEN_MIN),
  ]);
  if (!byUser || !byIp) {
    return NextResponse.json(
      { error: "محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = redeemPrepaidCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const code = normalizeCode(parsed.data.code);
  if (!code) {
    return NextResponse.json({ error: "الكود غير صحيح." }, { status: 400 });
  }

  const codeRow = await db.prepaidCode.findUnique({
    where: { code },
    include: { course: { select: { id: true, slug: true, title: true } } },
  });
  if (!codeRow) {
    return NextResponse.json(
      { error: "الكود غير صحيح أو غير موجود." },
      { status: 404 },
    );
  }

  if (parsed.data.courseId && parsed.data.courseId !== codeRow.courseId) {
    return NextResponse.json(
      { error: "هذا الكود لا يخص هذا الكورس." },
      { status: 400 },
    );
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: codeRow.courseId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "أنت مسجّل بالفعل في هذا الكورس." },
      { status: 409 },
    );
  }

  try {
    const claimed = await db.$transaction(async (tx) => {
      // Atomic single-use claim: only the first caller flipping isUsed
      // false→true wins. A racing second request updates 0 rows.
      const claim = await tx.prepaidCode.updateMany({
        where: { id: codeRow.id, isUsed: false },
        data: { isUsed: true, usedById: userId, usedAt: new Date() },
      });
      if (claim.count === 0) return false;

      // If this throws a unique-constraint error (the student got enrolled via
      // another path in the last few ms), the whole transaction — including
      // the claim above — rolls back, so the code is NOT burned.
      await tx.enrollment.create({
        data: { userId, courseId: codeRow.courseId },
      });
      return true;
    });

    if (!claimed) {
      return NextResponse.json(
        { error: "هذا الكود مُستخدَم من قبل." },
        { status: 409 },
      );
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "أنت مسجّل بالفعل في هذا الكورس." },
        { status: 409 },
      );
    }
    console.error("prepaid code redemption failed:", error);
    return NextResponse.json(
      { error: "تعذّر تفعيل الكود، حاول مرة أخرى." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    courseId: codeRow.courseId,
    courseSlug: codeRow.course.slug,
    courseTitle: codeRow.course.title,
  });
}
