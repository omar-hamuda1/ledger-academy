import { db } from "./db";

/**
 * In-app notifications. Best-effort — a notification failure must never break
 * the action that triggered it (mirrors `src/lib/audit.ts`).
 */

/** Deliver a notification to one specific user, or a handful. */
export async function notify(params: {
  userId: string | string[];
  title: string;
  body: string;
  href?: string;
}) {
  const userIds = Array.isArray(params.userId) ? params.userId : [params.userId];
  if (userIds.length === 0) return;
  try {
    await db.notification.createMany({
      data: userIds.map((targetUserId) => ({
        targetUserId,
        title: params.title,
        body: params.body,
        href: params.href,
      })),
    });
  } catch (error) {
    console.error("[notify] failed to write notification(s)", error);
  }
}

/**
 * One broadcast row (`targetUserId` null) visible to every STUDENT — no
 * fan-out, so student count doesn't matter. Not best-effort: the admin
 * compose route awaits this and surfaces failure.
 */
export async function broadcastToStudents(params: {
  title: string;
  body: string;
  href?: string;
  createdById: string;
}) {
  return db.notification.create({
    data: {
      targetUserId: null,
      createdById: params.createdById,
      title: params.title,
      body: params.body,
      href: params.href,
    },
  });
}
