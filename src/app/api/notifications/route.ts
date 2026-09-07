import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { visibleNotificationsWhere } from "@/lib/notifications";
import { broadcastToStudents } from "@/lib/notify";
import { createNotificationSchema } from "@/lib/validators/notifications";
import { logAudit } from "@/lib/audit";

// A user's own notifications (targeted + broadcasts if a student), newest
// first, with a per-user `read` flag derived from NotificationRead.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!userId || !role) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const where = visibleNotificationsWhere(userId, role);

  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { reads: { where: { userId }, select: { readAt: true } } },
    }),
    db.notification.count({ where: { ...where, reads: { none: { userId } } } }),
  ]);

  const notifications = rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    createdAt: n.createdAt,
    read: n.reads.length > 0,
  }));

  return NextResponse.json({ notifications, unreadCount });
}

// Admin composes a broadcast to all students.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const notification = await broadcastToStudents({
    title: parsed.data.title,
    body: parsed.data.message,
    createdById: admin.id,
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "notification.broadcast",
    targetType: "Notification",
    targetId: notification.id,
    metadata: { title: notification.title },
  });

  return NextResponse.json({ notification }, { status: 201 });
}
