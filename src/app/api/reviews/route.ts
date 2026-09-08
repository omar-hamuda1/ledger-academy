import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertReviewSchema } from "@/lib/validators/reviews";

// A student creates or edits their review for an enrolled course. One row per
// (user, course) — this upserts.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const parsed = upsertReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const { courseId, rating, body } = parsed.data;

  const enrolled = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrolled) {
    return NextResponse.json(
      { error: "يمكنك تقييم الكورسات المسجّل فيها فقط." },
      { status: 403 },
    );
  }

  const review = await db.review.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, rating, body: body || null },
    update: { rating, body: body || null },
  });

  return NextResponse.json({ review });
}
