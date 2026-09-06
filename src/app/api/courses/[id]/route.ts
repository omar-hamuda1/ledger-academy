import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { updateCourseSchema } from "@/lib/validators/course";
import { MIN_EGP_PRICE } from "@/lib/pricing";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  if (parsed.data.price > 0 && parsed.data.price < MIN_EGP_PRICE) {
    return NextResponse.json(
      {
        error: `السعر يجب أن يكون ${MIN_EGP_PRICE} ج.م على الأقل حتى تعمل بوابة الدفع، أو 0 لجعل الكورس مجانيًا.`,
      },
      { status: 400 }
    );
  }

  const { thumbnailUrl, ...rest } = parsed.data;

  const course = await db.course.update({
    where: { id },
    data: {
      ...rest,
      ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl || null } : {}),
    },
  });

  return NextResponse.json({ course });
}
