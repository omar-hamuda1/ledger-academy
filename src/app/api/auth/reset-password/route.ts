import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`reset-password:${ip}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "محاولات كثيرة جدًا، حاول لاحقًا." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { email } = parsed.data;

  const verifiedOtp = await db.otpCode.findFirst({
    where: {
      email,
      purpose: "RESET",
      verifiedAt: { gt: new Date(Date.now() - VERIFICATION_WINDOW_MS) },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!verifiedOtp) {
    return NextResponse.json(
      { error: "يجب تأكيد رمز التحقق أولًا." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "لا يوجد حساب مسجل بهذا البريد الإلكتروني." }, { status: 404 });
  }

  // Don't let a "reset" just re-set the same password.
  if (user.passwordHash && (await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  await db.otpCode.delete({ where: { id: verifiedOtp.id } });

  return NextResponse.json({ success: true });
}
