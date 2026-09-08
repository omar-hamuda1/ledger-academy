import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { bulkQuestionsSchema } from "@/lib/validators/quiz";
import { parseExamCsv } from "@/lib/exam-import";
import { logAudit } from "@/lib/audit";

// Admin uploads a CSV of MCQs for a lesson. Creates the lesson's quiz if it
// doesn't exist yet, then adds every parsed question in one transaction.
// All-or-nothing: if any row is invalid the whole file is rejected with a
// per-row error list and nothing is written.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const parsed = bulkQuestionsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const { lessonId, csv, mode } = parsed.data;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: { select: { id: true } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: "الدرس غير موجود." }, { status: 404 });
  }

  const { questions, errors } = parseExamCsv(csv);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "تعذّر استيراد الملف — صحّح الأخطاء التالية وأعد الرفع.", rowErrors: errors },
      { status: 400 },
    );
  }

  const { quizId, created } = await db.$transaction(async (tx) => {
    const quiz =
      lesson.quiz ?? (await tx.quiz.create({ data: { lessonId }, select: { id: true } }));

    if (mode === "replace") {
      await tx.question.deleteMany({ where: { quizId: quiz.id } });
    }

    const result = await tx.question.createMany({
      data: questions.map((q) => ({
        quizId: quiz.id,
        text: q.text,
        options: q.options,
        correctId: q.correctId,
      })),
    });

    return { quizId: quiz.id, created: result.count };
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "quiz.bulk_import",
    targetType: "Quiz",
    targetId: quizId,
    metadata: { lessonId, mode, count: created },
  });

  return NextResponse.json({ ok: true, quizId, created, mode }, { status: 201 });
}
