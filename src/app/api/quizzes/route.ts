import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { createQuizSchema } from "@/lib/validators/quiz";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await requireScope("courses");
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const existing = await db.quiz.findUnique({ where: { lessonId: parsed.data.lessonId } });
  if (existing) {
    return NextResponse.json({ quiz: existing }, { status: 200 });
  }

  const quiz = await db.quiz.create({ data: { lessonId: parsed.data.lessonId } });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "quiz.create",
    targetType: "Quiz",
    targetId: quiz.id,
    metadata: { lessonId: parsed.data.lessonId },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
