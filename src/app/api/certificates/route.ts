import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSerial, isCourseComplete } from "@/lib/certificates";

const bodySchema = z.object({ courseId: z.string().min(1) });

// Student claims their completion certificate. Idempotent — one per
// (user, course); returns the existing one if already issued.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const { courseId } = parsed.data;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "أنت غير مسجّل في هذا الكورس." }, { status: 403 });
  }

  const existing = await db.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    return NextResponse.json({ serial: existing.serial, alreadyIssued: true });
  }

  if (!(await isCourseComplete(userId, courseId))) {
    return NextResponse.json(
      { error: "أكمل جميع دروس الكورس أولًا للحصول على الشهادة." },
      { status: 400 },
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const cert = await db.certificate.create({
        data: { userId, courseId, serial: generateSerial() },
      });
      return NextResponse.json({ serial: cert.serial }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Serial clash (astronomically unlikely) → retry. A racing request that
        // already made the (user,course) row → return that one.
        const now = await db.certificate.findUnique({
          where: { userId_courseId: { userId, courseId } },
        });
        if (now) return NextResponse.json({ serial: now.serial, alreadyIssued: true });
        continue;
      }
      throw error;
    }
  }
  return NextResponse.json({ error: "تعذّر إصدار الشهادة، حاول مرة أخرى." }, { status: 500 });
}
