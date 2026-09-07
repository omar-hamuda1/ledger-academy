import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createCodeOrderSchema } from "@/lib/validators/code-orders";
import { paymentProofPrefix } from "@/lib/storage";
import { notify } from "@/lib/notify";
import { sendEmail, resolveAdminAlertEmails } from "@/lib/email";

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

  const { courseId, studentPhone, paymentNote, paymentProofKey } = parsed.data;

  // The proof must be an object this user uploaded (keys are namespaced by
  // uploader), not an arbitrary string or someone else's key.
  if (!paymentProofKey.startsWith(paymentProofPrefix(userId))) {
    return NextResponse.json(
      { error: "صورة إثبات الدفع غير صالحة." },
      { status: 400 },
    );
  }

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
    data: { userId, courseId, studentPhone, paymentNote, paymentProofKey },
  });

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });
  const studentName = session.user.name ?? "طالب";
  await notify({
    userId: admins.map((a) => a.id),
    title: "طلب كود جديد",
    body: `${studentName} طلب كودًا لكورس «${course.title}».`,
    href: "/dashboard/admin/code-orders",
  });

  // Best-effort email alert — must never break the student's request.
  try {
    const to = resolveAdminAlertEmails(
      admins.map((a) => a.email).filter((e): e is string => Boolean(e)),
    );
    if (to.length > 0) {
      const dashboardUrl = `${process.env.NEXTAUTH_URL ?? ""}/dashboard/admin/code-orders`;
      await sendEmail({
        to,
        subject: `طلب كود جديد — ${course.title}`,
        text:
          `وصل طلب جديد لشراء كورس على منصة Ledger Academy.\n\n` +
          `الكورس: ${course.title}\n` +
          `الطالب: ${studentName}\n` +
          `رقم الهاتف: ${studentPhone}\n` +
          `ملاحظة الدفع: ${paymentNote}\n\n` +
          `راجع الطلب ووافق عليه من لوحة التحكم:\n${dashboardUrl}`,
      });
    }
  } catch (err) {
    console.error("[code-orders] admin alert email failed", err);
  }

  return NextResponse.json({ order }, { status: 201 });
}
