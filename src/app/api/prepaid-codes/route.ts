import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { generatePrepaidCodesSchema } from "@/lib/validators/prepaid-codes";
import { generateCodeBatch } from "@/lib/prepaid-codes";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await requireScope("codes");
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = generatePrepaidCodesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { courseId, quantity } = parsed.data;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "الكورس غير موجود." }, { status: 404 });
  }

  // Generate → insert (skipping any astronomically-unlikely collision with an
  // existing code) → check how many actually landed → top up the shortfall.
  // Bounded rounds so a broken RNG can't loop forever.
  const created: string[] = [];
  for (let round = 0; round < 5 && created.length < quantity; round++) {
    const batch = generateCodeBatch(quantity - created.length);
    await db.prepaidCode.createMany({
      data: batch.map((code) => ({ code, courseId })),
      skipDuplicates: true,
    });
    const landed = await db.prepaidCode.findMany({
      where: { code: { in: batch }, courseId },
      select: { code: true },
    });
    created.push(...landed.map((c) => c.code));
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "prepaid_codes.generate",
    targetType: "Course",
    targetId: courseId,
    metadata: { quantity, created: created.length },
  });

  return NextResponse.json({ created: created.length, codes: created }, { status: 201 });
}
