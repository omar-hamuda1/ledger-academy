import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { createLessonSchema } from "@/lib/validators/lesson";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const { moduleId, title, videoUrl } = parsed.data;

  const parentModule = await db.module.findUnique({ where: { id: moduleId } });
  if (!parentModule) {
    return NextResponse.json({ error: "الوحدة غير موجودة." }, { status: 404 });
  }

  const { _max } = await db.lesson.aggregate({
    where: { moduleId },
    _max: { order: true },
  });

  const lesson = await db.lesson.create({
    data: {
      moduleId,
      title,
      videoUrl: videoUrl || null,
      order: (_max.order ?? 0) + 1,
    },
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "lesson.create",
    targetType: "Lesson",
    targetId: lesson.id,
    metadata: { title: lesson.title, moduleId },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
