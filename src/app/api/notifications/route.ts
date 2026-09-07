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

  // One query, not two: the bell polls this per user on an interval, so the
  // separate unread `count()` was doubling that load. `take: 20` already caps
  // the list; unread is derived from those rows and the badge shows "9+"
  // past 9 anyway, so an older-than-20 unread notification not being counted
  // is immaterial.
  const rows = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { reads: { where: { userId }, select: { readAt: true } } },
  });

  let unreadCount = 0;
  const notifications = rows.map((n) => {
    const read = n.reads.length > 0;
    if (!read) unreadCount++;
    return {
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.href,
      createdAt: n.createdAt,
      read,
    };
  });

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
