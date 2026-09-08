import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { answerSchema } from "@/lib/validators/qa";
import { lessonQAAccess } from "@/lib/lesson-qa";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

const TEN_MIN = 10 * 60 * 1000;

// Post an answer/reply on a question. The instructor or any enrolled student.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const parsed = answerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "اكتب ردًا." }, { status: 400 });
  }

  const { id: questionId } = await params;
  const question = await db.lessonQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, lessonId: true, userId: true },
  });
  if (!question) {
    return NextResponse.json({ error: "السؤال غير موجود." }, { status: 404 });
  }

  const admin = await requireAdmin();
  const access = await lessonQAAccess(question.lessonId, userId, !!admin);
  if (!access || !access.allowed) {
    return NextResponse.json({ error: "غير مصرح لك بالرد هنا." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const [byUser, byIp] = await Promise.all([
    checkRateLimit(`qa-answer:user:${userId}`, 30, TEN_MIN),
    checkRateLimit(`qa-answer:ip:${ip}`, 60, TEN_MIN),
  ]);
  if (!byUser || !byIp) {
    return NextResponse.json({ error: "ردود كثيرة في وقت قصير، حاول بعد قليل." }, { status: 429 });
  }

  const answer = await db.lessonAnswer.create({
    data: { questionId, userId, body: parsed.data.body, byInstructor: !!admin },
  });

  // Notify the asker (unless they answered their own question).
  if (question.userId !== userId) {
    await notify({
      userId: question.userId,
      title: admin ? "رد المحاضر على سؤالك" : "رد جديد على سؤالك",
      body: parsed.data.body.slice(0, 140),
      href: `/dashboard/student/courses/${access.courseSlug}/${question.lessonId}`,
    });
  }

  return NextResponse.json({ answer }, { status: 201 });
}
