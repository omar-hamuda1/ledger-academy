import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { askSchema } from "@/lib/validators/qa";
import { lessonQAAccess } from "@/lib/lesson-qa";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

const TEN_MIN = 10 * 60 * 1000;

// A student (or the instructor) posts a question on a lesson.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const parsed = askSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "اكتب سؤالك (٣ أحرف على الأقل)." }, { status: 400 });
  }

  const { id: lessonId } = await params;
  const admin = await requireAdmin();
  const access = await lessonQAAccess(lessonId, userId, !!admin);
  if (!access) return NextResponse.json({ error: "الدرس غير موجود." }, { status: 404 });
  if (!access.allowed) {
    return NextResponse.json({ error: "يجب الاشتراك في الكورس لطرح سؤال." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const [byUser, byIp] = await Promise.all([
    checkRateLimit(`qa-ask:user:${userId}`, 10, TEN_MIN),
    checkRateLimit(`qa-ask:ip:${ip}`, 20, TEN_MIN),
  ]);
  if (!byUser || !byIp) {
    return NextResponse.json({ error: "أسئلة كثيرة في وقت قصير، حاول بعد قليل." }, { status: 429 });
  }

  const question = await db.lessonQuestion.create({
    data: { lessonId, userId, body: parsed.data.body },
  });

  // Tell the admins there's a question waiting (best-effort). Skip if the
  // asker is an admin.
  if (!admin) {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await notify({
      userId: admins.map((a) => a.id),
      title: "سؤال جديد من طالب",
      body: `سؤال على درس «${access.lessonTitle}».`,
      href: `/dashboard/admin/lessons/${lessonId}`,
    });
  }

  return NextResponse.json({ question }, { status: 201 });
}
