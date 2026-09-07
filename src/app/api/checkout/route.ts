import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const checkoutSchema = z.object({ courseId: z.string().min(1) });

/**
 * Self-serve enrollment — **free courses only**. Paid courses are unlocked
 * with a prepaid code (`/api/prepaid-codes/redeem`) or an approved access
 * request (`/api/code-orders`). Stripe was removed: it never supported
 * Egypt-based merchants, and the platform moved to code-based access.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const course = await db.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course) return NextResponse.json({ error: "الكورس غير موجود." }, { status: 404 });

  if (Number(course.price) > 0) {
    return NextResponse.json(
      { error: "هذا الكورس مدفوع ويتطلب كودًا للوصول." },
      { status: 403 },
    );
  }

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    update: {},
    create: { userId, courseId: course.id },
  });
  return NextResponse.json({ free: true });
}
