import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { updateUserSchema } from "@/lib/validators/users";
import { logAudit } from "@/lib/audit";

// Admin manages another account: promote/demote between ADMIN and STUDENT, or
// disable/enable it (a disabled account can't log in — see src/lib/auth.ts).
// Guards: an admin can't act on their own row here, and the platform must
// always keep at least one active ADMIN.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "لا يمكنك تعديل دور أو حالة حسابك من هنا." },
      { status: 400 },
    );
  }

  const parsed = updateUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "المستخدم غير موجود." }, { status: 404 });
  }

  // Would this change remove the last active ADMIN?
  const losesAdmin =
    (parsed.data.action === "setRole" && parsed.data.role === "STUDENT" && target.role === "ADMIN") ||
    (parsed.data.action === "setDisabled" && parsed.data.disabled && target.role === "ADMIN");
  if (losesAdmin) {
    const otherActiveAdmins = await db.user.count({
      where: { role: "ADMIN", disabledAt: null, id: { not: target.id } },
    });
    if (otherActiveAdmins === 0) {
      return NextResponse.json(
        { error: "يجب أن يبقى محاضر واحد نشط على الأقل." },
        { status: 409 },
      );
    }
  }

  if (parsed.data.action === "setRole") {
    if (target.role === parsed.data.role) {
      return NextResponse.json({ user: target });
    }
    const user = await db.user.update({ where: { id }, data: { role: parsed.data.role } });
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "user.role_change",
      targetType: "User",
      targetId: id,
      metadata: { from: target.role, to: parsed.data.role },
    });
    return NextResponse.json({ user });
  }

  // setDisabled
  const disabledAt = parsed.data.disabled ? new Date() : null;
  if ((target.disabledAt === null) === (disabledAt === null)) {
    return NextResponse.json({ user: target });
  }
  const user = await db.user.update({ where: { id }, data: { disabledAt } });
  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: parsed.data.disabled ? "user.disable" : "user.enable",
    targetType: "User",
    targetId: id,
  });
  return NextResponse.json({ user });
}
