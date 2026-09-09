import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { updateUserSchema } from "@/lib/validators/users";
import { deleteUserCascade } from "@/lib/delete-user";
import { logAudit } from "@/lib/audit";

// Admin manages another account: promote/demote between ADMIN and STUDENT,
// disable/enable it (a disabled account can't log in — see src/lib/auth.ts),
// or reset its password (email-based reset isn't live yet). Guards: an admin
// can't act on their own row here, the platform must always keep at least one
// active ADMIN, and a `superAdmin` account can only be touched by another
// super-admin.
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

  // A super-admin account is protected: only another super-admin can change its
  // role, disable it, or reset its password. There is no API/UI path to grant
  // or revoke `superAdmin` itself — that's `npm run admin:super` (direct DB)
  // only — so a regular admin can never touch a protected account from here.
  if (target.superAdmin) {
    const actor = await db.user.findUnique({
      where: { id: admin.id },
      select: { superAdmin: true },
    });
    if (!actor?.superAdmin) {
      return NextResponse.json(
        { error: "لا يمكن تعديل حساب مسؤول رئيسي." },
        { status: 403 },
      );
    }
  }

  // Defense-in-depth "keep >=1 active ADMIN" check. Largely belt-and-suspenders
  // now that requireAdmin() itself demands an *active* admin actor (so you
  // can't reach 0 through a single request), but kept for the concurrent-demote
  // race and clarity.
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

  if (parsed.data.action === "setPassword") {
    // Admin-supplied password if given, otherwise a random temporary one the
    // admin relays to the user out of band. The plaintext is returned once in
    // this response and never logged.
    const password = parsed.data.password ?? randomBytes(9).toString("base64url");
    await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "user.password_reset",
      targetType: "User",
      targetId: id,
      metadata: { generated: !parsed.data.password },
    });
    return NextResponse.json({ password });
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

// Hard-delete an account and its footprint (see src/lib/delete-user.ts).
// Irreversible — "disable" is the non-destructive option. Same guards as PATCH,
// plus: an instructor who still owns courses can't be deleted.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "لا يمكنك حذف حسابك من هنا." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "المستخدم غير موجود." }, { status: 404 });
  }

  if (target.superAdmin) {
    const actor = await db.user.findUnique({
      where: { id: admin.id },
      select: { superAdmin: true },
    });
    if (!actor?.superAdmin) {
      return NextResponse.json({ error: "لا يمكن حذف حساب مسؤول رئيسي." }, { status: 403 });
    }
  }

  if (target.role === "ADMIN") {
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

  const ownedCourses = await db.course.count({ where: { instructorId: id } });
  if (ownedCourses > 0) {
    return NextResponse.json(
      {
        error: `هذا المستخدم محاضر يملك ${ownedCourses} كورس. أعد إسناد كورساته أو احذفها أولًا.`,
      },
      { status: 409 },
    );
  }

  await deleteUserCascade({ id: target.id, email: target.email });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "user.delete",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email, role: target.role },
  });

  return NextResponse.json({ ok: true });
}
