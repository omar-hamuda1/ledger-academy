import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { objectStore, avatarPrefix } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const HOUR = 60 * 60 * 1000;

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// Upload / replace the caller's profile photo.
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  if (!objectStore) {
    return NextResponse.json({ error: "رفع الصور غير مفعّل حاليًا على المنصة." }, { status: 503 });
  }

  const [byUser, byIp] = await Promise.all([
    checkRateLimit(`avatar:user:${userId}`, 10, HOUR),
    checkRateLimit(`avatar:ip:${getClientIp(req)}`, 30, HOUR),
  ]);
  if (!byUser || !byIp) {
    return NextResponse.json(
      { error: "محاولات رفع كثيرة. انتظر قليلًا ثم حاول مرة أخرى." },
      { status: 429 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
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
      { error: "حجم الصورة يجب أن يكون أقل من 3 ميجابايت." },
      { status: 400 },
    );
  }

  const key = `${avatarPrefix(userId)}${randomUUID()}.${ext}`;
  try {
    await objectStore.upload(key, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  } catch (error) {
    console.error("avatar upload failed:", error);
    return NextResponse.json({ error: "تعذّر رفع الصورة، حاول مرة أخرى." }, { status: 502 });
  }

  const prev = await db.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  await db.user.update({ where: { id: userId }, data: { avatarKey: key } });

  // best-effort cleanup of the old photo
  if (prev?.avatarKey && prev.avatarKey !== key) {
    objectStore.delete(prev.avatarKey).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

// Remove the caller's profile photo.
export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  if (user?.avatarKey) {
    await db.user.update({ where: { id: userId }, data: { avatarKey: null } });
    objectStore?.delete(user.avatarKey).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
