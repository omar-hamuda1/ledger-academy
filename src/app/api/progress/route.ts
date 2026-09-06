import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const progressSchema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean().optional(),
  watchedSec: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { lessonId, completed, watchedSec } = parsed.data;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "الدرس غير موجود." }, { status: 404 });

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "يجب الاشتراك في الكورس أولًا." }, { status: 403 });
  }

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed, watchedSec },
    create: { userId, lessonId, completed: completed ?? false, watchedSec: watchedSec ?? 0 },
  });

  return NextResponse.json({ progress });
}
