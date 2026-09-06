import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { createQuestionSchema } from "@/lib/validators/quiz";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id: quizId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const quiz = await db.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود." }, { status: 404 });

  const question = await db.question.create({
    data: {
      quizId,
      text: parsed.data.text,
      options: parsed.data.options,
      correctId: parsed.data.correctId,
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
