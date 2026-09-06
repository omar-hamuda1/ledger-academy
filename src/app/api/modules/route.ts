import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { createModuleSchema } from "@/lib/validators/module";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createModuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { courseId, title } = parsed.data;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "الكورس غير موجود." }, { status: 404 });
  }

  const { _max } = await db.module.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  const module_ = await db.module.create({
    data: {
      courseId,
      title,
      order: (_max.order ?? 0) + 1,
    },
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "module.create",
    targetType: "Module",
    targetId: module_.id,
    metadata: { title: module_.title, courseId },
  });

  return NextResponse.json({ module: module_ }, { status: 201 });
}
