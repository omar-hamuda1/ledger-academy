import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { createQuizSchema } from "@/lib/validators/quiz";

export async function POST(req: Request) {
  const admin = await requireAdmin();
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

  return NextResponse.json({ quiz }, { status: 201 });
}
