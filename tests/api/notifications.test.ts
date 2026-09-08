import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { GET as listNotifications, POST as broadcast } from "@/app/api/notifications/route";
import { POST as markRead } from "@/app/api/notifications/read/route";
import { db } from "@/lib/db";
import { createUser, cleanupUser } from "../helpers/fixtures";

describe("notifications", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let studentA: Awaited<ReturnType<typeof createUser>>;
  let studentB: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    studentA = await createUser("STUDENT");
    studentB = await createUser("STUDENT");
  });

  const extraUsers: string[] = [];

  afterAll(async () => {
    for (const id of extraUsers) await cleanupUser(id);
    await cleanupUser(studentA.id);
    await cleanupUser(studentB.id);
    await cleanupUser(admin.id);
  });

  beforeEach(() => vi.mocked(getServerSession).mockReset());

  const as = (id: string, role: "ADMIN" | "STUDENT", email?: string) =>
    vi.mocked(getServerSession).mockResolvedValue({ user: { id, role, email } } as never);

  function post(url: string, body: unknown) {
    return new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("a non-admin cannot broadcast", async () => {
    as(studentA.id, "STUDENT");
    const res = await broadcast(post("http://localhost/api/notifications", { title: "x", message: "y" }));
    expect(res.status).toBe(403);
  });

  it("admin broadcast is one row, visible+unread to every student, not to admins", async () => {
    as(admin.id, "ADMIN", admin.email);
    const res = await broadcast(
      post("http://localhost/api/notifications", {
        title: "اختبار الوحدة الأولى",
        message: "يوم الخميس الساعة 6 مساءً",
      }),
    );
    expect(res.status).toBe(201);
    const { notification } = await res.json();
    expect(notification.targetUserId).toBeNull();
    expect(notification.createdById).toBe(admin.id);

    // one row total for the broadcast
    expect(await db.notification.count({ where: { id: notification.id } })).toBe(1);

    as(studentA.id, "STUDENT");
    const listA = await (await listNotifications()).json();
    expect(listA.notifications.some((n: { id: string }) => n.id === notification.id)).toBe(true);
    expect(listA.unreadCount).toBeGreaterThanOrEqual(1);

    as(admin.id, "ADMIN", admin.email);
    const listAdmin = await (await listNotifications()).json();
    expect(listAdmin.notifications.some((n: { id: string }) => n.id === notification.id)).toBe(false);
  });

  it("mark-all-read is per user", async () => {
    as(studentA.id, "STUDENT");
    await markRead(post("http://localhost/api/notifications/read", { all: true }));
    const afterA = await (await listNotifications()).json();
    expect(afterA.unreadCount).toBe(0);

    as(studentB.id, "STUDENT");
    const stillB = await (await listNotifications()).json();
    expect(stillB.unreadCount).toBeGreaterThanOrEqual(1);
  });

  // Helper: a student whose join date is `offsetMs` relative to `ref`.
  async function studentJoiningAt(ref: Date, offsetMs: number) {
    const u = await createUser("STUDENT");
    extraUsers.push(u.id);
    return db.user.update({
      where: { id: u.id },
      data: { createdAt: new Date(ref.getTime() + offsetMs) },
    });
  }

  it("CURRENT_STUDENTS broadcast (default) is hidden from a student who joins afterwards", async () => {
    as(admin.id, "ADMIN", admin.email);
    const { notification } = await (
      await broadcast(
        post("http://localhost/api/notifications", { title: "تنبيه مؤقت", message: "لهذا الأسبوع" }),
      )
    ).json();
    expect(notification.audience).toBe("CURRENT_STUDENTS");
    const sentAt = new Date(notification.createdAt);

    const late = await studentJoiningAt(sentAt, 1000);
    const early = await studentJoiningAt(sentAt, -1000);

    as(late.id, "STUDENT");
    const lateList = await (await listNotifications()).json();
    expect(lateList.notifications.some((n: { id: string }) => n.id === notification.id)).toBe(false);

    as(early.id, "STUDENT");
    const earlyList = await (await listNotifications()).json();
    expect(earlyList.notifications.some((n: { id: string }) => n.id === notification.id)).toBe(true);
  });

  it("ALL_STUDENTS broadcast is visible to a student who joins afterwards", async () => {
    as(admin.id, "ADMIN", admin.email);
    const { notification } = await (
      await broadcast(
        post("http://localhost/api/notifications", {
          title: "دليل الاستخدام",
          message: "اقرأه دائمًا",
          audience: "ALL_STUDENTS",
        }),
      )
    ).json();
    expect(notification.audience).toBe("ALL_STUDENTS");

    const late = await studentJoiningAt(new Date(notification.createdAt), 60_000);
    as(late.id, "STUDENT");
    const lateList = await (await listNotifications()).json();
    expect(lateList.notifications.some((n: { id: string }) => n.id === notification.id)).toBe(true);
  });

  it("rejects an unknown audience value", async () => {
    as(admin.id, "ADMIN", admin.email);
    const res = await broadcast(
      post("http://localhost/api/notifications", {
        title: "x",
        message: "y",
        audience: "EVERYONE_EVER",
      }),
    );
    expect(res.status).toBe(400);
  });
});
