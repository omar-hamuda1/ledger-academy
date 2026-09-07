import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { paymentProofStore, paymentProofPrefix } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;
// Hard cap on stored proofs per user (~this * MAX_BYTES total). The hourly
// rate limit bounds bursts; this bounds accumulation across days, e.g. a
// student hammering the endpoint without ever submitting an order.
const MAX_STORED_PER_USER = 15;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const HOUR = 60 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  if (!paymentProofStore) {
    return NextResponse.json(
      { error: "رفع الملفات غير مفعّل حاليًا على المنصة." },
      { status: 503 },
    );
  }

  const [byUser, byIp] = await Promise.all([
    checkRateLimit(`proof-upload:user:${userId}`, 20, HOUR),
    checkRateLimit(`proof-upload:ip:${getClientIp(req)}`, 40, HOUR),
  ]);
  if (!byUser || !byIp) {
    return NextResponse.json(
      { error: "محاولات رفع كثيرة. انتظر قليلًا ثم حاول مرة أخرى." },
      { status: 429 },
    );
  }

  // Fail-open: if the listing hiccups, the rate limit is still the backstop.
  try {
    const existing = await paymentProofStore.list({
      prefix: paymentProofPrefix(userId),
      limit: MAX_STORED_PER_USER + 1,
    });
    if (existing.items.length >= MAX_STORED_PER_USER) {
      return NextResponse.json(
        { error: "لديك عدد كبير من الصور المرفوعة. تواصل مع الدعم لمتابعة طلبك." },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error("payment proof quota check failed:", error);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرفاق صورة." }, { status: 400 });
  }

  const ext = TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "الصيغة غير مدعومة. استخدم صورة JPG أو PNG أو WebP." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت." },
      { status: 400 },
    );
  }

  const key = `${paymentProofPrefix(userId)}${randomUUID()}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await paymentProofStore.upload(key, buffer, { contentType: file.type });
  } catch (error) {
    console.error("payment proof upload failed:", error);
    return NextResponse.json(
      { error: "تعذّر رفع الصورة، حاول مرة أخرى." },
      { status: 502 },
    );
  }

  return NextResponse.json({ key });
}
