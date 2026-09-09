import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { signQuizStart } from "@/lib/quiz-timer";

// Issues a fresh timed-quiz start token for an enrolled student. The quiz page
// mints the first one server-side on load; the client calls this only when the
// student hits "retry" so the countdown restarts from a server-known instant.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  const { id: quizId } = await params;
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { timeLimitSec: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!quiz) return NextResponse.json({ error: "الاختبار غير موجود." }, { status: 404 });

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: quiz.lesson.module.courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "يجب الاشتراك في الكورس أولًا." }, { status: 403 });
  }

  return NextResponse.json({ startToken: signQuizStart(quizId, userId) });
}
