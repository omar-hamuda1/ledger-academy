import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleNotificationsWhere } from "@/lib/notifications";

const schema = z.union([
  z.object({ id: z.string().min(1) }),
  z.object({ all: z.literal(true) }),
]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!userId || !role) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const account = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  const where = visibleNotificationsWhere(userId, role, account?.createdAt ?? new Date(0));

  // Only mark notifications the caller can actually see, and only ones not
  // already read (skipDuplicates guards the composite PK).
  const targets = await db.notification.findMany({
    where: {
      ...where,
      reads: { none: { userId } },
      ...("id" in parsed.data ? { id: parsed.data.id } : {}),
    },
    select: { id: true },
  });

  if (targets.length > 0) {
    await db.notificationRead.createMany({
      data: targets.map((n) => ({ notificationId: n.id, userId })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, marked: targets.length });
}
