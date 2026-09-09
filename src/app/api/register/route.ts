import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json(
      { error: "محاولات تسجيل كثيرة جدًا، حاول لاحقًا." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    const error =
      field === "guardianConsent"
        ? "يجب إقرار موافقة ولي الأمر للمتابعة."
        : field === "name"
          ? issue?.message || "أدخل اسمًا صحيحًا."
          : "بيانات غير صالحة.";
    return NextResponse.json({ error }, { status: 400 });
  }

  const { name, email, password, guardianName, guardianContact } = parsed.data;

  const verifiedOtp = await db.otpCode.findFirst({
    where: {
      email,
      purpose: "SIGNUP",
      verifiedAt: { gt: new Date(Date.now() - VERIFICATION_WINDOW_MS) },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!verifiedOtp) {
    return NextResponse.json(
      { error: "يجب تأكيد البريد الإلكتروني أولًا برمز التحقق." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      guardianConsentAt: new Date(),
      guardianName: guardianName || null,
      guardianContact: guardianContact || null,
    },
    select: { id: true, name: true, email: true },
  });

  await db.otpCode.delete({ where: { id: verifiedOtp.id } });

  return NextResponse.json({ user }, { status: 201 });
}
