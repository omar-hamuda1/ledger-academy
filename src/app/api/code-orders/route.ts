import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createCodeOrderSchema } from "@/lib/validators/code-orders";

const HOUR = 60 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const [byUser, byIp] = await Promise.all([
    checkRateLimit(`code-order:user:${userId}`, 10, HOUR),
    checkRateLimit(`code-order:ip:${ip}`, 30, HOUR),
  ]);
  if (!byUser || !byIp) {
    return NextResponse.json(
      { error: "لقد أرسلت طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createCodeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { courseId, studentPhone, paymentNote } = parsed.data;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "الكورس غير موجود." }, { status: 404 });
  }
  if (Number(course.price) <= 0) {
    return NextResponse.json(
      { error: "هذا الكورس مجاني، يمكنك التسجيل فيه مباشرة." },
      { status: 400 },
    );
  }

  const enrolled = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (enrolled) {
    return NextResponse.json(
      { error: "أنت مسجّل بالفعل في هذا الكورس." },
      { status: 409 },
    );
  }

  // One live request per course at a time — return the existing pending one
  // rather than stacking duplicates.
  const pending = await db.codeOrder.findFirst({
    where: { userId, courseId, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json({ order: pending, alreadyPending: true });
  }

  const order = await db.codeOrder.create({
    data: { userId, courseId, studentPhone, paymentNote },
  });

  return NextResponse.json({ order }, { status: 201 });
}
