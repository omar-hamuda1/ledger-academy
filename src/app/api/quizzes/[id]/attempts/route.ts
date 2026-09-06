import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitAttemptSchema } from "@/lib/validators/quiz";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  const { id: quizId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = submitAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود." }, { status: 404 });
  if (quiz.questions.length === 0) {
    return NextResponse.json({ error: "لا يحتوي هذا الاختبار على أسئلة." }, { status: 400 });
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: quiz.lesson.module.courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "يجب الاشتراك في الكورس أولًا." }, { status: 403 });
  }

  const { answers } = parsed.data;
  let correctCount = 0;
  const results = quiz.questions.map((question) => {
    const selectedId = answers[question.id];
    const isCorrect = selectedId === question.correctId;
    if (isCorrect) correctCount++;
    return { questionId: question.id, selectedId: selectedId ?? null, correctId: question.correctId, isCorrect };
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);

  const attempt = await db.quizAttempt.create({
    data: { userId, quizId, score },
  });

  return NextResponse.json({ attempt, score, correctCount, total: quiz.questions.length, results });
}
