import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { updateCourseSchema } from "@/lib/validators/course";
import { MIN_EGP_PRICE } from "@/lib/pricing";
import { logAudit } from "@/lib/audit";
import { revalidateCourseSurfaces } from "@/lib/revalidate";
import { deleteCourseCascade } from "@/lib/delete-course";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireScope("courses");
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

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "course.update",
    targetType: "Course",
    targetId: id,
    metadata: parsed.data,
  });

  revalidateCourseSurfaces();

  return NextResponse.json({ course });
}

// Hard-delete a course and everything under it (see src/lib/delete-course.ts).
// Irreversible. The client requires the admin to type the course slug to
// confirm; there's no "disable" fallback for a course, unpublishing is that.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireScope("courses");
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  const course = await db.course.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      _count: { select: { enrollments: true, certificates: true } },
    },
  });
  if (!course) {
    return NextResponse.json({ error: "الكورس غير موجود." }, { status: 404 });
  }

  await deleteCourseCascade(course.id);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "course.delete",
    targetType: "Course",
    targetId: id,
    metadata: {
      slug: course.slug,
      title: course.title,
      enrollments: course._count.enrollments,
      certificates: course._count.certificates,
    },
  });

  revalidateCourseSurfaces();

  return NextResponse.json({ ok: true });
}
