import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { createCourseSchema } from "@/lib/validators/course";
import { MIN_EGP_PRICE } from "@/lib/pricing";
import { logAudit } from "@/lib/audit";
import { revalidateCourseSurfaces } from "@/lib/revalidate";

export async function GET() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الكورس غير صالحة." }, { status: 400 });
  }

  const price = parsed.data.price ?? 0;
  if (price > 0 && price < MIN_EGP_PRICE) {
    return NextResponse.json(
      {
        error: `السعر يجب أن يكون ${MIN_EGP_PRICE} ج.م على الأقل حتى تعمل بوابة الدفع، أو 0 لجعل الكورس مجانيًا.`,
      },
      { status: 400 }
    );
  }

  const existing = await db.course.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json(
      { error: "يوجد كورس آخر بنفس الرابط (slug)، اختر رابطًا مختلفًا." },
      { status: 409 }
    );
  }

  const course = await db.course.create({
    data: { ...parsed.data, instructorId: admin.id },
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "course.create",
    targetType: "Course",
    targetId: course.id,
    metadata: { title: course.title, slug: course.slug, price: parsed.data.price },
  });

  revalidateCourseSurfaces();

  return NextResponse.json({ course }, { status: 201 });
}
