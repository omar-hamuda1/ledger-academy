import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyOtpSchema } from "@/lib/validators/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`otp-verify-ip:${ip}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة جدًا، حاول لاحقًا." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { email, purpose, code } = parsed.data;

  const otp = await db.otpCode.findFirst({
    where: { email, purpose, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json(
      { error: "الرمز غير صالح أو منتهي الصلاحية، اطلب رمزًا جديدًا." },
      { status: 400 }
    );
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "تجاوزت عدد المحاولات المسموح بها، اطلب رمزًا جديدًا." },
      { status: 429 }
    );
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);

  if (!isValid) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "رمز التحقق غير صحيح." }, { status: 400 });
  }

  await db.otpCode.update({ where: { id: otp.id }, data: { verifiedAt: new Date() } });

  return NextResponse.json({ verified: true });
}
