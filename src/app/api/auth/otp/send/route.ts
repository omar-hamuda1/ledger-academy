import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendOtpSchema } from "@/lib/validators/otp";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const OTP_TTL_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`otp-send-ip:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة جدًا، حاول لاحقًا." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بريد إلكتروني غير صالح." }, { status: 400 });
  }

  const { email, purpose } = parsed.data;

  if (!checkRateLimit(`otp-send:${email}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "تم إرسال عدة رموز لهذا البريد بالفعل، حاول بعد قليل." },
      { status: 429 }
    );
  }

  if (purpose === "SIGNUP") {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل." },
        { status: 409 }
      );
    }
  } else {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "لا يوجد حساب مسجل بهذا البريد الإلكتروني." },
        { status: 404 }
      );
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  // Invalidate any still-live codes from a previous send so verify only ever
  // has one candidate to check — otherwise requesting a resend and then
  // entering the *first* email's code fails against the newer row instead.
  await db.otpCode.deleteMany({ where: { email, purpose, verifiedAt: null } });

  await db.otpCode.create({
    data: {
      email,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendOtpEmail(email, code);

  return NextResponse.json({ success: true });
}
