import { NextResponse, after } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createCodeOrderSchema } from "@/lib/validators/code-orders";
import { paymentProofPrefix } from "@/lib/storage";
import { notify } from "@/lib/notify";
import { sendEmail, resolveAdminAlertEmails } from "@/lib/email";
import { sendTelegram } from "@/lib/telegram";

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

  const { courseId, studentPhone, paymentReference, paymentNote, paymentProofKey } = parsed.data;

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

  // One transfer backs one order — a reference already on any order (even the
  // caller's own, on another course) means either a typo or an attempt to
  // reuse a payment. The @unique index is the race-safe backstop below.
  const refClash = await db.codeOrder.findFirst({
    where: { paymentReference },
    select: { id: true },
  });
  if (refClash) {
    return NextResponse.json(
      { error: "رقم العملية هذا مُستخدم في طلب آخر. تأكد من الرقم أو تواصل مع الدعم." },
      { status: 409 },
    );
  }

  let order;
  try {
    order = await db.codeOrder.create({
      data: {
        userId,
        courseId,
        studentPhone,
        paymentReference,
        paymentNote: paymentNote ?? null,
        paymentProofKey,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "رقم العملية هذا مُستخدم في طلب آخر. تأكد من الرقم أو تواصل مع الدعم." },
        { status: 409 },
      );
    }
    throw error;
  }

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

  // Out-of-app alerts (email + Telegram) run after the response so they never
  // add latency to — or fail — the student's request. Both are best-effort and
  // no-op (console log) until their env vars are set.
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? ""}/dashboard/admin/code-orders`;
  const alertText =
    `طلب كود جديد على منصة Ledger Academy.\n\n` +
    `الكورس: ${course.title}\n` +
    `الطالب: ${studentName}\n` +
    `رقم الهاتف: ${studentPhone}\n` +
    `رقم العملية (إنستاباي): ${paymentReference}\n` +
    `المبلغ المتوقع: ${Number(course.price).toLocaleString("ar-EG")} ج.م\n` +
    (paymentNote ? `ملاحظة: ${paymentNote}\n` : "") +
    `\nراجع الطلب ووافق عليه:\n${dashboardUrl}`;
  const adminEmails = resolveAdminAlertEmails(
    admins.map((a) => a.email).filter((e): e is string => Boolean(e)),
  );

  after(async () => {
    await Promise.allSettled([
      adminEmails.length > 0
        ? sendEmail({ to: adminEmails, subject: `طلب كود جديد — ${course.title}`, text: alertText })
        : Promise.resolve(),
      sendTelegram(alertText),
    ]).then((results) => {
      for (const [i, r] of results.entries()) {
        if (r.status === "rejected") {
          console.error(`[code-orders] ${i === 0 ? "email" : "telegram"} alert failed`, r.reason);
        }
      }
    });
  });

  return NextResponse.json({ order }, { status: 201 });
}
